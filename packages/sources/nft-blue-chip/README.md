# NFT_BLUE_CHIP

![1.1.12](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nft-blue-chip/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |                       Name                        |                                                    Description                                                    |  Type  | Options | Default |
| :-------: | :-----------------------------------------------: | :---------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |                 ETHEREUM_RPC_URL                  |                                        RPC URL to an Ethereum mainnet node                                        | string |         |         |
|           |    MARKETCAP_TRANSPORT_MAX_RATE_LIMIT_RETRIES     | Maximum amount of times the Marketcap Transport will attempt to set up a request when blocked by the rate limiter | number |         |   `3`   |
|           | MARKETCAP_TRANSPORT_MS_BETWEEN_RATE_LIMIT_RETRIES |           Time that the Marketcap Transport will wait between retries when blocked by the rate limiter            | number |         |  `400`  |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |             Options              |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [marketcap](#marketcap-endpoint) | `marketcap` |

## Marketcap Endpoint

`marketcap` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
