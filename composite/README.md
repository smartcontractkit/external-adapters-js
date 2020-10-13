# Chainlink Composite Adapters

This section contains packages that represent composite adapters built form multiple Chainlink external adapters published to NPM under `@chainlink/` organization.

## Build

### Docker

To build a Docker container for a specific `$(adapter)`, run the following command from repository root:

```bash
make docker adapter=composite/proof-of-reserves name=proof-of-reserves
```

The naming convention for Docker containers will be `$(name)-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it proof-of-reserves-adapter:latest
```

### Serverless

Create the zip:

```bash
make zip adapter=composite/proof-of-reserves name=proof-of-reserves
```

The zip will be created as `./$(adapter)/dist/$(adapter)-adapter.zip`.
