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
  k6 run --log-format raw /load/dist/${TEST_TO_RUN} 2>~/output.log | tee ~/testResults.txt
  STATUS=${PIPESTATUS[0]}
else
  # used in local runs when you want to pass specific args to the test
  k6 $@
  STATUS=${PIPESTATUS[0]}
fi

# if this is being run against a pr then post results
if [ ! -z ${PR_NUMBER+x} ]; then
  echo "pr was set, sending pass/fail data to pr";
  TEST_OUTPUT=$(tail -n 150 ~/testResults.txt ~/output.txt)
  TEST_OUTPUT_ASSERTIONS=$(cat ~/output.log | grep "Assertion applied: " | sort | uniq)
  TEST_OUTPUT_ASSERTIONS_FAILED=$(cat ~/output.log | grep "Failed: " | sort | uniq)
  TEST_OUTPUT_ASSERTIONS_LOADED_COUNT=$(cat ~/output.log | grep "Assertion loaded: " | sort | uniq | wc -l)
  TEST_OUTPUT_ASSERTIONS_COUNT=$(cat ~/output.log | grep "Assertion applied: " | sort | uniq | wc -l)
  TEST_OUTPUT_SAMPLE=$(cat ~/output.log | grep -e "request: " -e "DEBUG: " | tail -n 200)
  TEST_OUTPUT_PARAM_NUM=$(sed 's/^request: \(.*\) response.*/\1/' ~/output.log | sort | uniq | wc -l)
  if [ "$TEST_OUTPUT_PARAM_NUM" -lt 5 ]; then
    TEST_OUTPUT_MESSAGE=":warning: Only $TEST_OUTPUT_PARAM_NUM unique input parameter sets. Update test-payload.json to increase the coverage. "
  elif [ "$TEST_OUTPUT_PARAM_NUM" -eq 0 ]; then
    TEST_OUTPUT_MESSAGE=":warning: Assertions loaded: ${TEST_OUTPUT_ASSERTIONS_LOADED_COUNT}, applied: ${TEST_OUTPUT_ASSERTIONS_COUNT}"
  elif [ -z "$TEST_OUTPUT_ASSERTIONS_FAILED"]; then
    TEST_OUTPUT_MESSAGE=":heavy_check_mark: Assertions loaded: ${TEST_OUTPUT_ASSERTIONS_LOADED_COUNT}, applied: ${TEST_OUTPUT_ASSERTIONS_COUNT}" 
    TEST_OUTPUT_ASSERTIONS_FAILED="(no failed assertions)"
  else
    TEST_OUTPUT_MESSAGE=":warning: Assertions failed"
  fi

  if [ $STATUS -ne 0 ]; then
    echo "test failed"
    SOAK_TEST_MESSAGE=":warning: Soak test failed for ${CI_ADAPTER_NAME} :warning:"
  else
    echo "test passed"
    SOAK_TEST_MESSAGE=":heavy_check_mark: Soak test for ${CI_ADAPTER_NAME} succeeded"
  fi
  gh pr comment ${PR_NUMBER} -R smartcontractkit/external-adapters-js -b "<details><summary>${SOAK_TEST_MESSAGE}</summary>

\`\`\`
${TEST_OUTPUT}
\`\`\`
</details>

<details><summary>${TEST_OUTPUT_MESSAGE}</summary>

\`\`\`
Applied:
${TEST_OUTPUT_ASSERTIONS}

Failed:
${TEST_OUTPUT_ASSERTIONS_FAILED}
\`\`\`

</details>

<details><summary>Output sample</summary>

\`\`\`
${TEST_OUTPUT_SAMPLE}
\`\`\`

</details>
"
fi
