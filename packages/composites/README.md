# Chainlink Composite Adapters

This section contains packages that represent composite adapters built from multiple Chainlink external adapters published to NPM under the `@chainlink` organization.

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
