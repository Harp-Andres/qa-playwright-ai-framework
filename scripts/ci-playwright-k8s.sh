#!/usr/bin/env bash
# Builds the test image once, runs one indexed Playwright pod per shard, reads
# the shared evidence volume through a collector pod, and merges the blob
# reports with Playwright itself.
set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-qa-playwright}"
IMAGE="${IMAGE:-qa-playwright-ai-framework:latest}"
SKIP_BUILD="${SKIP_BUILD:-false}"
KIND_VERSION="${KIND_VERSION:-v0.33.0}"
KIND_NODE_IMAGE="${KIND_NODE_IMAGE:-kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1500}"
NAMESPACE="qa-playwright"
JOB_NAME="qa-playwright-tests"
COLLECTOR="qa-playwright-evidence-collector"
PVC="qa-playwright-evidence"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${root}"

install_binary() {
  local name="$1"
  local url="$2"
  curl -fsSL -o "/tmp/${name}" "${url}"
  chmod +x "/tmp/${name}"
  sudo mv "/tmp/${name}" "/usr/local/bin/${name}"
}

if ! command -v kind >/dev/null 2>&1; then
  install_binary kind "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64"
fi
if ! command -v kubectl >/dev/null 2>&1; then
  install_binary kubectl "https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
fi

# Renders a kustomization with the image under test, without editing tracked files.
render() {
  local tmp
  tmp="$(mktemp -d "${root}/.kustomize-XXXXXX")"
  cat > "${tmp}/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../$1
images:
  - name: qa-playwright-ai-framework
    newName: ${IMAGE%:*}
    newTag: ${IMAGE##*:}
EOF
  kubectl kustomize "${tmp}"
  rm -rf "${tmp}"
}

if ! kind get clusters 2>/dev/null | grep -qx "${CLUSTER_NAME}"; then
  kind create cluster --name "${CLUSTER_NAME}" --image "${KIND_NODE_IMAGE}"
fi

if [[ "${SKIP_BUILD}" != "true" ]]; then
  docker build -t "${IMAGE}" .
fi
kind load docker-image "${IMAGE}" --name "${CLUSTER_NAME}"

# Each run starts from an empty evidence volume.
kubectl -n "${NAMESPACE}" delete pod "${COLLECTOR}" --ignore-not-found=true --wait=true 2>/dev/null || true
kubectl -n "${NAMESPACE}" delete job "${JOB_NAME}" --ignore-not-found=true --wait=true 2>/dev/null || true
kubectl -n "${NAMESPACE}" delete pvc "${PVC}" --ignore-not-found=true --wait=true 2>/dev/null || true
render k8s | kubectl apply -f -

job_status=0
completions="$(kubectl -n "${NAMESPACE}" get job "${JOB_NAME}" -o jsonpath='{.spec.completions}')"
deadline=$((SECONDS + TIMEOUT_SECONDS))
job_result=""
while (( SECONDS < deadline )); do
  if [[ "$(kubectl -n "${NAMESPACE}" get job "${JOB_NAME}" -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}')" == "True" ]]; then
    job_result="Complete"
    break
  fi
  if [[ "$(kubectl -n "${NAMESPACE}" get job "${JOB_NAME}" -o jsonpath='{.status.conditions[?(@.type=="Failed")].status}')" == "True" ]]; then
    job_result="Failed"
    break
  fi
  sleep 10
done
echo "Job ${JOB_NAME} result: ${job_result:-timeout}"
kubectl -n "${NAMESPACE}" get pods -l "batch.kubernetes.io/job-name=${JOB_NAME}" -o wide || true

if [[ "${job_result}" != "Complete" ]]; then
  job_status=1
  kubectl -n "${NAMESPACE}" describe job "${JOB_NAME}" || true
  for pod in $(kubectl -n "${NAMESPACE}" get pods -l "batch.kubernetes.io/job-name=${JOB_NAME}" --field-selector=status.phase=Failed -o name); do
    kubectl -n "${NAMESPACE}" logs "${pod}" --tail=40 2>/dev/null | while IFS= read -r line; do
      echo "::error title=${pod#pod/}::${line}"
    done || true
  done
fi

rm -rf pod-reports playwright-report test-results blob-report artifacts
mkdir -p pod-reports playwright-report test-results blob-report artifacts

render k8s/collector | kubectl apply -f -
# kubectl wait fails at once if the API does not list the new pod yet.
collector_ready=false
for _ in $(seq 1 18); do
  if kubectl -n "${NAMESPACE}" wait --for=condition=Ready "pod/${COLLECTOR}" --timeout=10s 2>/dev/null; then
    collector_ready=true
    break
  fi
  sleep 2
done
if [[ "${collector_ready}" == "true" ]]; then
  kubectl -n "${NAMESPACE}" cp "${COLLECTOR}:/evidence/." pod-reports || job_status=1
else
  echo "::error::evidence collector pod did not become ready"
  kubectl -n "${NAMESPACE}" describe pod "${COLLECTOR}" || true
  job_status=1
fi
kubectl -n "${NAMESPACE}" delete pod "${COLLECTOR}" --wait=false || true

for (( shard = 1; shard <= completions; shard++ )); do
  dest="pod-reports/shard-${shard}"
  exit_code="$(tr -cd '0-9' < "${dest}/exit-code" 2>/dev/null || true)"
  exit_code="${exit_code:-1}"
  echo "::notice title=shard-${shard}::shard exit ${exit_code}"
  if [[ "${exit_code}" != "0" ]]; then
    job_status=1
  fi

  shopt -s nullglob
  shard_zips=("${dest}/blob-report/"*.zip)
  shopt -u nullglob
  if (( ${#shard_zips[@]} == 0 )); then
    echo "::error title=shard-${shard}::no blob report zip, this shard is missing from the merged report"
    job_status=1
  fi
  for zip in "${shard_zips[@]}"; do
    cp "${zip}" "blob-report/shard-${shard}-$(basename "${zip}")"
  done

  if [[ -d "${dest}/artifacts" ]]; then
    mkdir -p "artifacts/shard-${shard}"
    cp -a "${dest}/artifacts/." "artifacts/shard-${shard}/" || true
  fi
done

merge_status=0
shopt -s nullglob
zips=(blob-report/*.zip)
shopt -u nullglob
if (( ${#zips[@]} != completions )); then
  echo "::error::expected ${completions} blob reports (one per shard), collected ${#zips[@]}"
  merge_status=1
fi
if (( ${#zips[@]} == 0 )); then
  echo "No blob reports were collected from the shards"
  merge_status=1
else
  # merge-reports writes report.jsonl beside the blobs, so this mount stays writable.
  if ! docker run --rm \
    --user "$(id -u):$(id -g)" \
    -e HOME=/tmp \
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
