# Synthetix Index

Get Synthetix index data

## Docker

To build a Docker container for a specific `$adapter`, use the following example, ran from the root of the repository:

```bash
make docker-synth-index adapter=coinapi
```

The build argument `--build-arg` is required. This will be the directory of the adapter you wish to build.

The naming convention for synthetix index Docker containers will be `synth-index-$adapter-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it synth-index-coinapi-adapter:latest
```

## Serverless

Create the zip:

```bash
make zip-synth-index adapter=coinapi
```

The zip will be created as `./synth-index/$adapter/dist/synth-index-$adapter-adapter.zip`.
