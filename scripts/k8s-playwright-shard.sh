#!/usr/bin/env bash
# One indexed Job pod. Playwright writes on the container filesystem, then this
# script copies the evidence to the shared volume under /evidence/shard-<n> and
# exits with the test status so Kubernetes reports the shard result.
set -u

shard="$(( ${JOB_COMPLETION_INDEX:-0} + 1 ))"
total="${SHARD_TOTAL:-1}"
dest="/evidence/shard-${shard}"
status=0

echo "Running Playwright shard ${shard}/${total}"
npx playwright test --shard="${shard}/${total}" || status=$?

rm -rf "${dest}"
mkdir -p "${dest}"
for dir in playwright-report test-results blob-report artifacts; do
  mkdir -p "${dest}/${dir}"
  cp -a "/app/${dir}/." "${dest}/${dir}/" 2>/dev/null || true
done
printf '%s\n' "${status}" > "${dest}/exit-code"

echo "Shard ${shard} finished with status ${status}. Evidence in ${dest}."
exit "${status}"
