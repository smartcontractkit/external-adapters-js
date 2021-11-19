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

# if this is being run against a pr then post results
if [ ! -z ${PR_NUMBER+x} ]; then 
  echo "pr was set, sending pass/fail data to pr";
  if [ $STATUS -ne 0 ]; then
    echo "test failed"
    FAILURE_DATA=$(tail -n 150 ~/testResults.txt)
    # push fail data to pr as a comment
    # gh pr review ${PR_NUMBER} -c -b "${FAILURE_DATA}"
    gh pr comment ${PR_NUMBER} -b "Soak test for ${CI_ADAPTER_NAME} failed: ```${FAILURE_DATA}```"
  else
    echo "test passed"
    # gh pr review ${PR_NUMBER} -c -b "Soak tests look good"
    gh pr comment ${PR_NUMBER} -c -b "Soak test for ${CI_ADAPTER_NAME} passed}"
  fi
fi
