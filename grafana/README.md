Use the following commands while in the `/grafana` folder to set up metrics.

For Linux:

1. `./scripts/generate-prom-config.sh localhost`
2. `docker-compose up`
3. `./scripts/deploy.sh`
4. Run adapter using `export CACHE_REDIS_URL=redis://localhost:6379`
