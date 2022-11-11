#!/bin/bash
set -x

if [ -f /load/.env ]
then
  export $(cat /load/.env | sed 's/#.*//g' | xargs)
fi

TEST_TO_RUN=test.js
if [ ! -z ${TEST_FILE+x} ]; then
  echo "Setting the test file to run to: ${TEST_FILE}";
  TEST_TO_RUN=${TEST_FILE}
fi

echo "env TEST_DURATION=${TEST_DURATION}"
echo "env TEST_FILE=${TEST_FILE}"
echo "env WS_ENABLED=${WS_ENABLED}"
echo "env PAYLOAD_GENERATED=${PAYLOAD_GENERATED}"
echo "env CI_SECONDS_PER_CALL=${CI_SECONDS_PER_CALL}"
echo "env CI_ADAPTER_NAME=${CI_ADAPTER_NAME}"
echo "env QA_RELEASE_TAG=${QA_RELEASE_TAG}"
echo "env PR_NUMBER=${PR_NUMBER}"

STATUS=0
if [ $# -eq 0 ]; then
  # used in k8s
  k6 run /load/dist/${TEST_TO_RUN} | tee ~/testResults.txt
  STATUS=${PIPESTATUS[0]}
else
  # used in local runs when you want to pass specific args to the test
  k6 $@
  STATUS=${PIPESTATUS[0]}
fi

# DEBUG
echo "TEST_FILE: "${TEST_FILE}
echo `ls ~/`

# if this is being run against a pr then post results
if [ ! -z ${PR_NUMBER+x} ]; then
  echo "pr was set, sending pass/fail data to pr";
  TEST_OUTPUT=$(tail -n 150 ~/testResults.txt)
  TEST_OUTPUT_ASSERTIONS=$(cat output.log | grep "Assertion failed" | tail -n 150)
  if [ $STATUS -ne 0 ]; then
    echo "test failed"
    # push fail data to pr as a comment
    # gh pr review ${PR_NUMBER} -R smartcontractkit/external-adapters-js -c -b "${FAILURE_DATA}"
    gh pr comment ${PR_NUMBER} -R smartcontractkit/external-adapters-js -b "<details><summary>:warning: Soak test for ${CI_ADAPTER_NAME} failed :warning:</summary>

\`\`\`
${TEST_OUTPUT}
\`\`\`

\`\`\`
${TEST_OUTPUT_ASSERTIONS}
\`\`\`

</details>"
  else
    echo "test passed"
    # gh pr review ${PR_NUMBER} -R smartcontractkit/external-adapters-js -c -b "Soak tests look good"
    gh pr comment ${PR_NUMBER} -R smartcontractkit/external-adapters-js -b "<details><summary>:heavy_check_mark: Soak test for ${CI_ADAPTER_NAME} succeeded</summary>

\`\`\`
${TEST_OUTPUT}
\`\`\`

\`\`\`
${TEST_OUTPUT_ASSERTIONS}
\`\`\`

</details>"
  fi
fi
