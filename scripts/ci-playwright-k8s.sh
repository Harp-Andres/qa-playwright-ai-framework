#!/usr/bin/env bash
# Builds the test image, runs one indexed Playwright pod per shard, copies each
# pod's evidence, and merges the blob reports with Playwright itself.
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-qa-playwright}"
IMAGE="${IMAGE:-qa-playwright-ai-framework:latest}"
KIND_VERSION="${KIND_VERSION:-v0.33.0}"
KIND_NODE_IMAGE="${KIND_NODE_IMAGE:-kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5}"
JOB_NAME="qa-playwright-tests"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-900}"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"

install_binary() {
  local name="$1"
  local url="$2"
  if command -v "${name}" >/dev/null 2>&1; then
    return
  fi
  curl -fsSL -o "/tmp/${name}" "${url}"
  chmod +x "/tmp/${name}"
  sudo mv "/tmp/${name}" "/usr/local/bin/${name}"
}

install_binary kind "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64"
kubectl_version="$(curl -fsSL https://dl.k8s.io/release/stable.txt)"
install_binary kubectl "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl"

if ! kind get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"; then
  kind create cluster --name "${CLUSTER_NAME}" --image "${KIND_NODE_IMAGE}"
fi

docker build -t "${IMAGE}" .
kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}"

kubectl apply -f k8s/configmap.yaml
kubectl delete job "${JOB_NAME}" --ignore-not-found=true
kubectl apply -f k8s/job.yaml

job_status=0
completions="$(kubectl get job "${JOB_NAME}" -o jsonpath='{.spec.completions}')"
deadline=$((SECONDS + TIMEOUT_SECONDS))
ready_pods=0
while (( SECONDS < deadline )); do
  mapfile -t pods < <(kubectl get pods -l "job-name=${JOB_NAME}" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)
  ready_pods=0
  for pod in "${pods[@]}"; do
    [[ -z "${pod}" ]] && continue
    if kubectl exec "${pod}" -- test -f /app/shard-exit-code >/dev/null 2>&1; then
      ready_pods=$((ready_pods + 1))
    fi
  done
  if (( ready_pods == completions )) && (( completions > 0 )); then
    break
  fi
  sleep 5
done

if (( ready_pods != completions )); then
  echo "Timed out waiting for shard evidence"
  kubectl describe job "${JOB_NAME}" || true
  kubectl logs -l "job-name=${JOB_NAME}" --prefix --tail=200 || true
  job_status=1
fi

rm -rf pod-reports playwright-report test-results blob-report artifacts
mkdir -p pod-reports playwright-report test-results blob-report artifacts

mapfile -t pods < <(kubectl get pods -l "job-name=${JOB_NAME}" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)
for pod in "${pods[@]}"; do
  [[ -z "${pod}" ]] && continue
  dest="pod-reports/${pod}"
  mkdir -p "${dest}/playwright-report" "${dest}/test-results" "${dest}/blob-report" "${dest}/artifacts"
  kubectl cp "${pod}:/app/playwright-report/." "${dest}/playwright-report" || true
  kubectl cp "${pod}:/app/test-results/." "${dest}/test-results" || true
  kubectl cp "${pod}:/app/blob-report/." "${dest}/blob-report" || true
  kubectl cp "${pod}:/app/artifacts/." "${dest}/artifacts" || true

  shopt -s nullglob
  for zip in "${dest}/blob-report/"*.zip; do
    cp "${zip}" "blob-report/${pod}-$(basename "${zip}")"
  done
  shopt -u nullglob

  if [[ -d "${dest}/artifacts" ]]; then
    mkdir -p "artifacts/${pod}"
    cp -a "${dest}/artifacts/." "artifacts/${pod}/" || true
  fi

  raw_exit="$(kubectl exec "${pod}" -- cat /app/shard-exit-code 2>/dev/null | head -n 1 || true)"
  exit_code="$(printf '%s' "${raw_exit}" | tr -cd '0-9')"
  if [[ -z "${exit_code}" ]]; then
    exit_code=1
  fi
  echo "Pod ${pod} shard exit ${exit_code}"
  echo "::notice title=${pod}::shard exit ${exit_code}"
  if [[ "${exit_code}" != "0" ]]; then
    job_status=1
    kubectl logs "${pod}" --tail=40 2>/dev/null | while IFS= read -r line; do
      echo "::error title=${pod}::${line}"
    done || true
  fi
  kubectl exec "${pod}" -- touch /app/shard-collected >/dev/null 2>&1 || true
done

merge_status=0
shopt -s nullglob
zips=(blob-report/*.zip)
shopt -u nullglob
if (( ${#zips[@]} == 0 )); then
  echo "No blob reports were collected from the pods"
  merge_status=1
else
  # merge-reports writes report.jsonl beside the blobs, so this mount stays writable.
  if ! docker run --rm \
    --entrypoint npx \
    -v "${PWD}/blob-report:/blob" \
    -v "${PWD}/playwright-report:/app/playwright-report" \
    -v "${PWD}/test-results:/app/test-results" \
    -e TEST_ENV=qa \
    "${IMAGE}" \
    playwright merge-reports -c playwright.merge.config.ts /blob
  then
    merge_status=1
  fi
fi

if [[ ! -f playwright-report/index.html || ! -f test-results/results.xml ]]; then
  echo "Merged Playwright report is incomplete"
  merge_status=1
fi

if [[ "${job_status}" -ne 0 || "${merge_status}" -ne 0 ]]; then
  echo "Playwright Kubernetes job failed"
  exit 1
fi
