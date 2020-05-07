# Market Closure

Market closure adapters first check if a given market is currently trading, and if not, will retrieve the current price on the Chainlink reference contract.

## Docker

To build a Docker container for a specific container, use the following example, ran from the root of the repository:

```bash
make docker-market-closure adapter=finnhub check=tradinghours
```

Both build arguments `--build-arg` are required. This will be the directory of the adapter you wish to build.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -e TH_API_KEY='YOUR_TRADINGHOURS_API_KEY' -e RPC_URL='YOUR_RPC_URL' -it finnhub-tradinghours-adapter:latest
```

## Serverless

Create the zip:

```bash
make zip-market-closure adapter=finnhub check=tradinghours
```
