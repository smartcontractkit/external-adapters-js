# 2-step adapters

2-step adapters read the value from a given reference contract before using that value to transform the result from the
data provider.

## Docker

To build a Docker container for a specific `$adapter`, use the following example, ran from the root of the repository:

```bash
make docker-2-step adapter=finnhub
```

The build argument `--build-arg` is required. This will be the directory of the adapter you wish to build.

The naming convention for market closure Docker containers will be `$adapter-2-step-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -e RPC_URL='YOUR_RPC_URL' -it finnhub-2-step-adapter:latest
```

## Serverless

Create the zip:

```bash
make zip-2-step adapter=finnhub
```

The zip will be created as `./2-step/$check/dist/$adapter-2-step-adapter.zip`.
