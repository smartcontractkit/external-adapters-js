# Chainlink Proof of Reserves composite adapter

This composite adapter first queries a list of custodial contracts of a protocol, then queries the BTC balances of each of these addresses, and finally reduces the balances to one total result.

## Configuration

The feed takes the following environment variables:

| Required? |                              Name                               |            Description             |                                            Options                                            | Defaults to |
| :-------: | :-------------------------------------------------------------: | :--------------------------------: | :-------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |                       `PROTOCOL_ADAPTER`                        |         The protocol type          |                                        `renvm`, `wbtc`                                        |             |
|    ✅     |                      `BTC_INDEXER_ADAPTER`                      |      BTC indexer adapter type      | `amberdata`, `blockchain_com`, `blockcypher`. `blockchair`, `btc_com`,`cryptoapis`, `sochain` |             |
|    🟡     | `*_API_KEY` (where \* is the capitalized `BTC_INDEXER_ADAPTER`) | The API key for an indexer adapter |                          (e.g. BLOCKCYPHER_API_KEY="34234dmmd313" )                           |             |
|           |

Each protocol may need additional configuration:

### RENVM

| Required? |      Name       |    Description     |             Options              | Defaults to |
| :-------: | :-------------: | :----------------: | :------------------------------: | :---------: |
|    ✅     | `RENVM_NETWORK` | The network to use | `mainnet`, `chaosnet`, `testnet` |             |

### WBTC

| Required? |        Name         |          Description          |         Options          | Defaults to |
| :-------: | :-----------------: | :---------------------------: | :----------------------: | :---------: |
|    ✅     | `WBTC_API_ENDPOINT` | The endpoint to query WBTC at | (e.g. "https://api..." ) |             |

Each indexer may take additional configuration:

### Blockcypher

| Required? |             Name             |                                                                    Description                                                                    | Options | Defaults to |
| :-------: | :--------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | `BLOCKCYPHER_API_RATE_LIMIT` | Provide the plan rate limit to throttle the amount of requests that are sent per second. This is useful for using a lower tier subscription plan. |         |             |

### BTC_COM

| Required? |                                 Name                                 |                   Description                    | Options | Defaults to |
| :-------: | :------------------------------------------------------------------: | :----------------------------------------------: | :-----: | :---------: |
|    🟡     | `BTC_COM_API_SECRET` (only when using `BTC_INDEXER_ADAPTER=btc_com`) | An API secret set up through BTC.com's dashboard |

## Running this adapter

### Local

Ensure that the project's dependencies are installed and that the code is compiled by running the following command from the external-adapters respository root:

```bash
yarn && yarn setup
```

Change directories into proof-of-reserves and start the server:

```bash
cd composite/proof-of-reserves && yarn start
```

### Docker

To build a Docker container for a specific `$(adapter)`, run the following command from repository root:

```bash
make docker adapter=composite/proof-of-reserves name=proof-of-reserves
```

The naming convention for Docker containers will be `$(name)-adapter`.

Then run it with:

```bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

(Note: Docker environment file string values do not use " or ' quote marks)

### Serverless

Create the zip:

```bash
make zip adapter=composite/proof-of-reserves name=proof-of-reserves
```

The zip will be created as `./$(adapter)/dist/$(name)-adapter.zip`.

## Sample Request

Requests to this composite adapter will be the same as for the underlying protocol adapter.

For example this might look like:

```bash
curl --header "Content-Type: application/json"   --request POST   --data '{"data":{"network":"mainnet"}}'   http://localhost:8080
```
