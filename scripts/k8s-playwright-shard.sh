#!/usr/bin/env bash
# One indexed Job pod. Playwright writes on the container filesystem, then this
# script copies the evidence onto the pod volume so a mounted directory is not
# deleted when Playwright cleans its output folders.
set -u

shard="$(( ${JOB_COMPLETION_INDEX:-0} + 1 ))"
total="${SHARD_TOTAL:-2}"
status=0

echo "Running Playwright shard ${shard}/${total}"
npx playwright test --shard="${shard}/${total}" || status=$?

mkdir -p /evidence/playwright-report /evidence/test-results /evidence/blob-report /evidence/artifacts
cp -a /app/playwright-report/. /evidence/playwright-report/ || true
cp -a /app/test-results/. /evidence/test-results/ || true
cp -a /app/blob-report/. /evidence/blob-report/ || true
cp -a /app/artifacts/. /evidence/artifacts/ || true
printf '%s\n' "${status}" > /app/shard-exit-code
printf '%s\n' "${status}" > /evidence/exit-code || true
echo "Shard finished with status ${status}. Waiting for evidence collection."

for _ in $(seq 1 180); do
  if [[ -f /app/shard-collected ]]; then
    exit "${status}"
  fi
  sleep 5
done

echo "Evidence was not collected within 15 minutes"
exit "${status}"
