# Chainlink Composite Adapters

This section contains packages that represent composite adapters built form multiple Chainlink external adapters published to NPM under the `@chainlink` organization.

## Run

First build the project:

```bash
yarn build
```

Then run:

Mainnet wBTC & Blockchain.com:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=wbtc \
  WBTC_API_ENDPOINT=https://api \
  BTC_BALANCE_ADAPTER=blockchain.com \
  BLOCKCHAIN_COM_API_KEY=123-api-key \
  yarn start
```

Mainnet wBTC & Blockcypher:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=wbtc \
  WBTC_API_ENDPOINT=https://api \
  BTC_BALANCE_ADAPTER=blockcypher \
  BLOCKCYPHER_API_KEY=123-api-key \
  yarn start
```

Mainnet renBTC - Blockcypher:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=renvm \
  RENVM_NETWORK=mainnet \
  BTC_BALANCE_ADAPTER=blockcypher \
  BLOCKCYPHER_API_KEY=123-api-key \
  yarn start
```

Mainnet renBTC - Blockchain.com:

```bash
env \
  LOG_LEVEL=debug \
  PROTOCOL_ADAPTER=renvm \
  RENVM_NETWORK=mainnet \
  BTC_BALANCE_ADAPTER=blockchain.com \
  BLOCKCHAIN_COM_API_KEY=123-api-key \
  yarn start
```

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

The zip will be created as `./$(adapter)/dist/$(name)-adapter.zip`.
