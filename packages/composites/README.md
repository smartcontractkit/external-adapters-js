# Chainlink Composite External Adapters

This section contains packages that represent composite adapters, which request data from one or more other running adapters.

They are published to NPM under the `@chainlink` organization.

This document was generated automatically. Please see [Master List Generator](../scripts#master-list-generator) for more info.

## Service Discovery

Composite adapters rely on other external adapters to retrieve their own provider specific data. In setting up a composite adapter the locations of these underlying external adapters will need to be set as environment variables using `[name]_ADAPTER_URL`. See the specific composite adapter's documentation for further details.

## Running

### Local

Ensure that the project's dependencies are installed and that the code is compiled by running the following command from the external-adapters respository root:

```bash
yarn && yarn build
```

Run the underlying external adapters and set their locations as environment variables. For example, using the [proof-of-reserves](./proof-of-reservers) composite adapter with the [WBTC](../sources/wbtc-address-set) and [blockchain.com](../sources/blockchain.com) adapters.

```bash
export WBTC_ADAPTER_URL=localhost:3000 BLOCKCHAIN_COM_ADAPTER_URL=localhost:3001
```

Change directories into proof-of-reserves and start the server:

```bash
cd composites/proof-of-reserves && yarn start
```

### Docker

To build a Docker container for a specific `$(adapter)`, run the following command from repository root:

```bash
make docker adapter=composite/proof-of-reserves name=proof-of-reserves
```

The naming convention for Docker containers will be `$(name)-adapter`.

Run the underlying external adapters and set their locations as environment variables (it is convenient to do this in a file that is fed into the run command).

(Note: Docker environment file string values do not use " or ' quote marks)

Then run it with:

```bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

## List

- [anchor](./anchor/README.md)
- [apy-finance](./apy-finance/README.md)
- [augur](./augur/README.md)
- [bitcoin-json-rpc](./bitcoin-json-rpc/README.md)
- [bob](./bob/README.md)
- [bsol-price](./bsol-price/README.md)
- [circuit-breaker](./circuit-breaker/README.md)
- [crypto-volatility-index](./crypto-volatility-index/README.md)
- [defi-dozen](./defi-dozen/README.md)
- [defi-pulse](./defi-pulse/README.md)
- [dns-record-check](./dns-record-check/README.md)
- [dxdao](./dxdao/README.md)
- [dydx-rewards](./dydx-rewards/README.md)
- [google-weather](./google-weather/README.md)
- [historical-average](./historical-average/README.md)
- [linear-finance](./linear-finance/README.md)
- [market-closure](./market-closure/README.md)
- [medianizer](./medianizer/README.md)
- [nftx](./nftx/README.md)
- [outlier-detection](./outlier-detection/README.md)
- [por-indexer](./por-indexer/README.md)
- [proof-of-reserves](./proof-of-reserves/README.md)
- [reference-transform](./reference-transform/README.md)
- [savax-price](./savax-price/README.md)
- [set-token-index](./set-token-index/README.md)
- [synth-index](./synth-index/README.md)
- [the-graph](./the-graph/README.md)
- [token-allocation](./token-allocation/README.md)
- [vesper](./vesper/README.md)
- [xsushi-price](./xsushi-price/README.md)
