# Chainlink Proof of Reserves composite adapter

This composite adapter first queries a list of custodial contracts of a protocol, then queries the BTC or ETH balances of each of these addresses, and finally reduces the balances to one total result.

## Configuration

Each request to this composite adapter uses two underlying adapters, therefore their location needs to be defined.

At least one of each of the following categories must be set as an environment variable:

1. A protocol adapter to retrieve custodial addresses (if not using `list`)

   | Required? |                Name                 |                       Description                        | Options | Defaults to |
   | :-------: | :---------------------------------: | :------------------------------------------------------: | :-----: | :---------: |
   |           | `CELSIUS_ADDRESS_LIST_ADAPTER_URL`  |      The location of a Celsius Address List adapter      |         |             |
   |           | `CHAIN_RESERVE_WALLET_ADAPTER_URL`  |      The location of a Chain reserve wallet adapter      |         |             |
   |           |    `COINBASE_PRIME_ADAPTER_URL`     |         The location of a Coinbase Prime adapter         |         |             |
   |           |  `COINBASE_PRIME_ETH_ADAPTER_URL`   |         The location of a Coinbase Prime adapter         |         |             |
   |           |        `GEMINI_ADAPTER_URL`         |        The location of a Gemini external adapter         |         |             |
   |           | `MOONBEAM_ADDRESS_LIST_ADAPTER_URL` | The location of a Moonbeam Address List external adapter |         |             |
   |           |   `POR_ADDRESS_LIST_ADAPTER_URL`    |   The location of a PoR Address List external adapter    |         |             |
   |           |         `RENVM_ADAPTER_URL`         |         The location of a RenVM external adapter         |         |             |
   |           |  `STADER_ADDRESS_LIST_ADAPTER_URL`  |  The location of a Stader Address List external adapter  |         |             |
   |           |  `SWELL_ADDRESS_LIST_ADAPTER_URL`   |  The location of a Swell Address List external adapter   |         |             |
   |           |         `WBTC_ADAPTER_URL`          |         The location of a WBTC external adapter          |         |             |
   |           |        `WRAPPED_ADAPTER_URL`        |        The location of a Wrapped external adapter        |         |             |

2. An indexer adapter to retrieve account balances for each custodial address

   | Required? |               Name               |                         Description                          | Options | Defaults to |
   | :-------: | :------------------------------: | :----------------------------------------------------------: | :-----: | :---------: |
   |           |    `ADA_BALANCE_ADAPTER_URL`     |        The location of a Ada balance external adapter        |         |             |
   |           |     `AMBERDATA_ADAPTER_URL`      |        The location of an Amberdata external adapter         |         |             |
   |           | `AVALANCHE_PLATFORM_ADAPTER_URL` |    The location of an Avalance Platform external adapter     |         |             |
   |           |  `BITCOIN_JSON_RPC_ADAPTER_URL`  |     The location of an Bitcoin JSON RPC external adapter     |         |             |
   |           |   `BLOCKCHAIN_COM_ADAPTER_URL`   |      The location of a Blockchain.com external adapter       |         |             |
   |           |     `BLOCKCHAIR_ADAPTER_URL`     |        The location of a Blockchair external adapter         |         |             |
   |           |    `BLOCKCYPHER_ADAPTER_URL`     |        The location of a Blockcypher external adapter        |         |             |
   |           |      `BTC_COM_ADAPTER_URL`       |          The location of a BTC.com external adapter          |         |             |
   |           |     `CRYPTOAPIS_ADAPTER_URL`     |        The location of a Crypto APIs external adapter        |         |             |
   |           |    `ETH_BALANCE_ADAPTER_URL`     |        The location of a EthBalance external adapter         |         |             |
   |           |     `ETH_BEACON_ADAPTER_URL`     |        The location of an ETH Beacon external adapter        |         |             |
   |           |       `LOTUS_ADAPTER_URL`        |           The location of a Lotus external adapter           |         |             |
   |           |  `POLKADOT_BALANCE_ADAPTER_URL`  |     The location of a Polkadot Balance external adapter      |         |             |
   |           |    `POR_INDEXER_ADAPTER_URL`     | The location of a Proof-of-Reserves Indexer external adapter |         |             |
   |           |      `SOCHAIN_ADAPTER_URL`       |          The location of a SoChain external adapter          |         |             |
   |           |   `STADER_BALANCE_ADAPTER_URL`   |      The location of a Stader Balance external adapter       |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |                Name                |                                             Description                                              |                                                                                                                      Options                                                                                                                       | Defaults to |
| :-------: | :--------------------------------: | :--------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |             `protocol`             |                                 The protocol external adapter to use                                 |            `celsius_address_list`, `chain_reserve_wallet`, `coinbase_prime`, `coinbase_prime_eth` `gemini`,`moonbeam_address_list`, `list`, `por_address_list`, `renvm`, `stader_address_list`, `swell_address_list`, `wbtc`, `wrapped`            |             |
|    ✅     |             `indexer`              |                                 The indexer external adapter to use                                  | `ada_balance`, `amberdata`, `avalanche_platform`, `bitcoin_json_rpc`, `blockchain_com`. `blockchair`, `blockcypher`, `btc_com`, `cryptoapis`, `eth_balance`, `eth_beacon`, `lotus`, `polkadot_balance`, `por_indexer`, `sochain`, `stader_balance` |             |
|           |          `confirmations`           | The number of confirmations required for a transaction to be counted when getting an address balance |                                                                                                                                                                                                                                                    |      6      |
|           |            `addresses`             |           An array of addresses to get the balance from, when "protocol" is set to `list`            |                                                                                                                                                                                                                                                    |             |
|           |     `disableAddressValidation`     |               if this parameter is set to `true` address validation will be turned off               |                                                                                                                  `true`, `false`                                                                                                                   |   `false`   |
|           | `disableDuplicateAddressFiltering` |          if this parameter is set to `true` duplicate address filtering will be turned off           |                                                                                                                  `true`, `false`                                                                                                                   |   `false`   |

Additionally the first underlying adapter in the sequence, in this case the protocol adapter, may have parameters.

For example RenVM uses the following:

| Required? |       Name        |                  Description                   |                         Options                         | Defaults to |
| :-------: | :---------------: | :--------------------------------------------: | :-----------------------------------------------------: | :---------: |
|           |     `network`     |          The RenVM network to talk to          |            `mainnet`, `chaosnet`, `testnet`             |  `testnet`  |
|           | `tokenOrContract` | The token or contract to return an address for | `RenTokens`, `RenContract`, `Asset`, `BTC` `ZEC`, `BCH` |    `BTC`    |

Please check the protocol external adapter's README for more information.
