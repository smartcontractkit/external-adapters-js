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

Testing is done with one adapter at a time, with a pre-configured RPS target. The runs as follows:

1. 5m warm-up period that will start sending every possible unique request
2. The rest of the test is split up into 10 parts, each adding 10% of the target RPS until reaching the full target RPS.
   1. Each part has a 1m scaleup period to scale the RPS

### 1. Getting payloads

We can generate payloads from the RDD using:

```bash
yarn qa:flux:configure k6payload ${adapter} empty
```

### 2. Which adapters to use

To specify the EA to use, set `CI_ADAPTER_NAME` in the `limits.env` file. E.g.:

```dotenv
ADAPTER_URL=http://localhost:8080
```

### 3. Tweak config

- **TEST_DURATION**: How long to run each part of the test for. This is the period of time with a stable RPS, after the
  scaleup period.
- **SCALEUP_DURATION**: How long to run the scaleup between each part of the test.
- **RPS**: How many requests to target per second at most
- **T**: The expected time for each request. Should to include network latency. This is used to determine how many
  workers to use to send requests, and how often. The more accurate this variable is, the more constant the RPS will be.
- **UNIQUE_REQUESTS**: The number of unique requests (payloads/price pairs) to send. This number might get reduced to a
  lower amount if there aren't enough unique payloads available. Pay attention to the startup log! It is expected that
  this number is lower than RPS.

```dotenv
TEST_DURATION=10m
SCALEUP_DURATION=1m
RPS=1000
T=2
UNIQUE_REQUESTS=100
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

### 5. Understand the result

The test will exit as soon as the thresholds are exceeded. Output will look something like this:

```
     ✓ returns 200 status code
     ✓ returns result within expected numeric range
     ✗ doesn't exceed T
      ↳  99% — ✓ 19277 / ✗ 63

   ✓ checks.........................: 99.89% ✓ 57957     ✗ 63
     data_received..................: 8.4 MB 35 kB/s
     data_sent......................: 3.7 MB 15 kB/s
     errors.........................: 0.32%  ✓ 63        ✗ 19277
     http_req_blocked...............: avg=56.07µs  min=10.2µs  med=20.1µs   max=52.88ms p(90)=41.7µs   p(95)=67.4µs
     http_req_connecting............: avg=17.32µs  min=0s      med=0s       max=7.77ms  p(90)=0s       p(95)=0s
   ✗ http_req_duration..............: avg=168.07ms min=204.6µs med=101.68ms max=15.8s   p(90)=310.42ms p(95)=451.13ms
       { expected_response:true }...: avg=168.07ms min=204.6µs med=101.68ms max=15.8s   p(90)=310.42ms p(95)=451.13ms
   ✓ http_req_failed................: 0.00%  ✓ 0         ✗ 19340
     http_req_receiving.............: avg=152.85µs min=48.09µs med=116.7µs  max=92.56ms p(90)=209.1µs  p(95)=308.8µs
     http_req_sending...............: avg=65.36µs  min=14.5µs  med=39.19µs  max=2.54ms  p(90)=100.9µs  p(95)=158.51µs
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s       max=0s      p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=167.85ms min=0s      med=101.45ms max=15.8s   p(90)=310.16ms p(95)=451ms
     http_reqs......................: 19340  79.996098/s
     iteration_duration.............: avg=2.01s    min=1.99s   med=2s       max=15.8s   p(90)=2s       p(95)=2s
     iterations.....................: 19171  79.297063/s
     vus............................: 400    min=1       max=400
     vus_max........................: 2000   min=2000    max=2000

time="2022-03-29T09:58:29Z" level=error msg="some thresholds have failed"
```

We can see that the cause for the exit was the `http_req_duration` threshold being exceeded.

We can also see some relevant stats:

- `http_reqs` for the entire test was 79.996098/s. This is the average amount of RPS during the entire test.
- `vus` ended at 400. This means that the RPS before exceeding the thresholds was `400/T` (in this case T=2, meaning RPS was 200)

The actual RPS the EA can handle will be somewhere between these two values, with `http_reqs` being a safe estimate and
`vus/T` being at the point that exceeds our thresholds.

It's important to note that this is the RPS it can handle with the configured amount of unique requests, as a lower
amount of unique requests can be easier to handle than a higher amount. Try out different amounts of unique requests to
understand how the RPS limits changes.
