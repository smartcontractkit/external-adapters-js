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

## Upper limit testing

K6 can be used to test the upper limits of the EAs. This is done by measuring how many requests we can send per second
(RPS), where certain metrics are within certain thresholds.

Testing is done with one adapter at a time, with a pre-configured RPS target.

### 1. Getting payloads

We can generate payloads from the RDD using:

```bash
yarn qa:flux:configure k6payload ${adapter} empty
```

### 2. Which adapters to use

To specify the EA to use, set `CI_ADAPTER_NAME` in the `limits.env` file. E.g.:

```dotenv
CI_ADAPTER_NAME=coingecko
```

We can use a local EA or separated load-testing EAs in infra-k8s.
For local EAs, include `LOCAL_ADAPTER_NAME` in the `limits.env` file. E.g.:

```dotenv
LOCAL_ADAPTER_NAME=coingecko
```

If not set, the script will target the EA in staging k8s with the name `$CI_ADAPTER_NAME-load-testing`.

### 3. Tweak config

- **TEST_DURATION**: How long to run the test for. This is the period of time with a stable RPS, after a 5m warmup and
  1m scale-up time.
- **RPS**: How many requests to target per second
- **T**: The expected time for each request. Should to include network latency. This is used to determine how many
  workers to use to send requests, and how often. The more accurate this variable is, the more constant the RPS will be.

```dotenv
TEST_DURATION=1h
RPS=100
T=2
```

### 4. Run it!

If you haven't already, build the test files:

```bash
yarn build
```

Once completed, you can run the test:

```bash
# This command assumes you are running it from the directory of this README
docker run -v $(pwd)/dist:/load -v $(pwd)/src/config:/config --env-file limits.env -i loadimpact/k6 run /load/testLimits.js
```
