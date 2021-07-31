### k6 Load Testing

1. `docker pull loadimpact/k6`

2. `docker run -v [[RELATIVE PATH TO /load]]:/load -i loadimpact/k6 run /load/test.js`

When running against local adapters Docker will need to know the path to your local machine.

Add the following flags after `run`:
`--add-host=host.docker.internal:host-gateway --network="host"`
