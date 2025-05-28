# Rocket Pool Adapter

![1.1.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/rocket-pool/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Chainlink external adapter for rETH-related feeds.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |                         Description                          |  Type  | Options | Default |
| :-------: | :--------------: | :----------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | RPC URL to Ethereum mainnet. Used for rETH staking contract. | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [reth](#reth-endpoint) | `reth`  |

## Reth Endpoint

This endpoint returns the exchange rate of rETH/ETH according to the staking contract on Ethereum mainnet (L1), optionally as a price feed.

`reth` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases |                                  Description                                   |  Type  | Options |                   Default                    | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :----------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: | :--------: | :------------: |
|           |       quote        |         |                        Quote currency to pull price for                        | string |  `USD`  |                                              |            |                |
|           |      network       |         | Network to query for price feed (EA must have `<network>_RPC_URL` configured). | string |         |                  `ethereum`                  |            |                |
|           | ethUsdProxyAddress |         |            Address for the ETH/USD price feed on the given network             | string |         | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` |            |                |
|           | rethStorageAddress |         |        Address for the Rocket Storage contract on the Ethereum network         | string |         | `0xae78736Cd615f374D3085123A210448E74Fc6393` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
