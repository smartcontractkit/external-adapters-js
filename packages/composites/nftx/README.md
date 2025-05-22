# Chainlink NFTX Collection Price Composite Adapter

![3.0.29](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/nftx/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter calculates NFTX redemption values for an NFT collection, combining the price for the associated vToken with the collection's fee settings.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |        Description         |  Type  | Options | Default |
| :-------: | :---------------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  |                            | string |         |         |
|           | ETHEREUM_CHAIN_ID | The chain id to connect to | string |         |   `1`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |          Aliases          |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----------------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | vaultAddress | `address`, `tokenAddress` | The address of the NFTX vault being queried for. | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
