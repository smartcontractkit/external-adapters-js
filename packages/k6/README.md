### k6 Load Testing

1. `docker pull loadimpact/k6`

2. `docker run --add-host=host.docker.internal:host-gateway -v [[RELATIVE PATH TO /load]]:/load -i loadimpact/k6 run /load/test.js`
