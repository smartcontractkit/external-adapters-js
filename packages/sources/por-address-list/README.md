# POR_ADDRESS_LIST

![5.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/por-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name             |                                                                       Description                                                                        |  Type  | Options |                                      Default                                      |
| :-------: | :-------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------------------------------------------------------: |
|    ✅     |           RPC_URL           |                                   The RPC URL to connect to the EVM chain the address manager contract is deployed to.                                   | string |         |                                                                                   |
|           |          CHAIN_ID           |                                                        The chain id to connect to for the RPC URL                                                        | number |         |                                        `1`                                        |
|           |         GROUP_SIZE          | The number of concurrent batched contract calls to make at a time. Setting this lower than the default may result in lower performance from the adapter. | number |         |                                       `100`                                       |
|           |    BACKGROUND_EXECUTE_MS    |                                The amount of time the background execute should sleep before performing the next request                                 | number |         |                                      `10000`                                      |
|           | BEDROCK_UNIBTC_API_ENDPOINT |                                               An API endpoint for Bedrock uniBTC native BTC wallet address                                               | string |         |           `https://bedrock-datacenter.rockx.com/uniBTC/reserve/address`           |
|           |    SOLVBTC_API_ENDPOINT     |                                                  An API endpoint for SolvBTC native BTC wallet address                                                   | string |         | `https://solv-btcaddress-test.s3.us-east-1.amazonaws.com/solv-btc-addresses.json` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                   Options                                                                                    |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint), [bedrockbtcaddress](#bedrockbtcaddress-endpoint), [multichainaddress](#multichainaddress-endpoint), [solvbtcaddress](#solvbtcaddress-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |          Name          | Aliases |                                             Description                                              |  Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------------: | :-----: | :--------------------------------------------------------------------------------------------------: | :-----: | :-----: | :-----: | :--------: | :------------: |
|           |     confirmations      |         |                            The number of confirmations to query data from                            | number  |         |         |            |                |
|    ✅     |    contractAddress     |         |                         The contract address holding the custodial addresses                         | string  |         |         |            |                |
|           | contractAddressNetwork |         | The network of the contract, used to match {NETWORK}\_RPC_URL and {NETWORK}\_RPC_CHAIN_ID in env var | string  |         |         |            |                |
|           |       batchSize        |         |                     The number of addresses to fetch from the contract at a time                     | number  |         |  `10`   |            |                |
|    ✅     |        network         |         |                           The network name to associate with the addresses                           | string  |         |         |            |                |
|    ✅     |        chainId         |         |                             The chain ID to associate with the addresses                             | string  |         |         |            |                |
|           | searchLimboValidators  |         |                Flag to pass on to the balance adapter to search for limbo validators                 | boolean |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "address",
    "confirmations": 0,
    "contractAddress": "abc",
    "contractAddressNetwork": "",
    "batchSize": 10,
    "network": "ethereum",
    "chainId": "1"
  }
}
```

---

## Solvbtcaddress Endpoint

`solvbtcaddress` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "solvbtcaddress"
  }
}
```

---

## Bedrockbtcaddress Endpoint

`bedrockbtcaddress` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "bedrockbtcaddress"
  }
}
```

---

## Multichainaddress Endpoint

`multichainaddress` is the only supported name for this endpoint.

### Input Params

| Required? |          Name          | Aliases |                                             Description                                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------------: | :-----: | :--------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    contractAddress     |         |                         The contract address holding the custodial addresses                         | string |         |         |            |                |
|    ✅     | contractAddressNetwork |         | The network of the contract, used to match {NETWORK}\_RPC_URL and {NETWORK}\_RPC_CHAIN_ID in env var | string |         |         |            |                |
|           |     confirmations      |         |                            The number of confirmations to query data from                            | number |         |         |            |                |
|           |       batchSize        |         |                     The number of addresses to fetch from the contract at a time                     | number |         |  `10`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "multichainaddress",
    "contractAddress": "0xb7C0817Dd23DE89E4204502dd2C2EF7F57d3A3B8",
    "contractAddressNetwork": "BINANCE",
    "confirmations": 0,
    "batchSize": 10
  }
}
```

---

MIT License
