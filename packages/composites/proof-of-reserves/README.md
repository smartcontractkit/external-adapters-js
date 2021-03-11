# Chainlink Proof of Reserves composite adapter

This composite adapter first queries a list of custodial contracts of a protocol, then queries the BTC balances of each of these addresses, and finally reduces the balances to one total result.

## Configuration

Each request to this composite adapter uses two underlying adapters, therefore their location needs to be defined.

At least one of each of the following categories must be set as an environment variable:

1. A protocol adapter to retrieve custodial addresses

   | Required? |           Name            |               Description                | Options | Defaults to |
   | :-------: | :-----------------------: | :--------------------------------------: | :-----: | :---------: |
   |           | `WBTC_DATA_PROVIDER_URL`  | The location of a WBTC external adapter  |         |             |
   |           | `RENVM_DATA_PROVIDER_URL` | The location of a RenVM external adapter |         |             |

2. An indexer adapter to retrieve account balances for each custodial address

   | Required? |                Name                |                    Description                    | Options | Defaults to |
   | :-------: | :--------------------------------: | :-----------------------------------------------: | :-----: | :---------: |
   |           |   `AMBERDATA_DATA_PROVIDER_URL`    |   The location of an Amberdata external adapter   |         |             |
   |           | `BLOCKCHAIN_COM_DATA_PROVIDER_URL` | The location of a Blockchain.com external adapter |         |             |
   |           |  `BLOCKCYPHER_DATA_PROVIDER_URL`   |  The location of a Blockcypher external adapter   |         |             |
   |           |   `BLOCKCHAIR_DATA_PROVIDER_URL`   |   The location of a Blockchair external adapter   |         |             |
   |           |    `BTC_COM_DATA_PROVIDER_URL`     |    The location of a BTC.com external adapter     |         |             |
   |           |   `CRYPTOAPIS_DATA_PROVIDER_URL`   |  The location of a Crypto APIs external adapter   |         |             |
   |           |    `SOCHAIN_DATA_PROVIDER_URL`     |    The location of a SoChain external adapter     |         |             |

## Running this adapter

### Local

Ensure that the project's dependencies are installed and that the code is compiled by running the following command from the external-adapters respository root:

```bash
yarn && yarn setup
```

Run the underlying external adapters and set their locations as environment variables.

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

Run the underlying external adapters and set their locations as environment variables (it is convenient to do this in a file that is fed into the run command).

(Note: Docker environment file string values do not use " or ' quote marks)

Then run it with:

```bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

### Input Params

| Required? |      Name       |                                             Description                                              |                                            Options                                            | Defaults to |
| :-------: | :-------------: | :--------------------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |   `protocol`    |                                 The protocol external adapter to use                                 |                                        `renvm`, `wbtc`                                        |             |
|    ✅     |    `indexer`    |                                 The indexer external adapter to use                                  | `amberdata`, `blockchain_com`, `blockcypher`. `blockchair`, `btc_com`,`cryptoapis`, `sochain` |             |
|    🟡     | `confirmations` | The number of confirmations required for a transaction to be counted when getting an address balance |                                                                                               |      6      |

Additionally the first underlying adapter in the sequence, in this case the protocol adapter, may have parameters.

For example RenVM uses the following:

| Required? |       Name        |                  Description                   |                         Options                         | Defaults to |
| :-------: | :---------------: | :--------------------------------------------: | :-----------------------------------------------------: | :---------: |
|           |     `network`     |          The RenVM network to talk to          |            `mainnet`, `chaosnet`, `testnet`             |  `testnet`  |
|           | `tokenOrContract` | The token or contract to return an address for | `RenTokens`, `RenContract`, `Asset`, `BTC` `ZEC`, `BCH` |    `BTC`    |

Please check the protocol external adapter's README for more information.
