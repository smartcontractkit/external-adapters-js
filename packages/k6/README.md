### k6 Load Testing

1. `docker pull loadimpact/k6`

2. `docker run -v [[RELATIVE PATH TO /dist]]:/load -i loadimpact/k6 run /load/test.js`

When running against local adapters Docker will need to know the path to your local machine.

Add the following flags after `run`:
`--add-host=host.docker.internal:host-gateway --network="host"`

To test using docker against ephemeral adapters you can follow the below:
1. Set any environment variables you need for this test in the .env file.
2. If running against an ephemeral adapter set the QA_RELEASE_TAG in the .env to the same RELEASE_TAG used when starting the adapter. If you are just running against adapters in the staging cluster you should leave this blank.
3. If you want to use generated data from weiwatchers set the environment variable PAYLOAD_GENERATED=true in the .env file and run the code below where ${adapter} is the adapter you wish to test.
    ```bash
    yarn qa:flux:configure k6payload ${adapter} empty
    ```
4. If you want to specify the adapter and calls per second outside of hard coding changes you can edit these two variables in the .env file:
    ```bash
    CI_ADAPTER_NAME=coingecko
    CI_SECONDS_PER_CALL=10
    ```
5. If you want to change the test duration or test file you can edit the associated variables in the .env file:
    ```bash
    TEST_DURATION=40m
    TEST_FILE=test.js
    ```
6. To run the test run:
    ```bash
    yarn test:docker
    ```