# Chainlink NFTX Collection Price Composite Adapter

![3.0.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/nftx/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

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

Request:

```json
{
  "id": "1",
  "data": {
    "vaultAddress": "0x269616D549D7e8Eaa82DFb17028d0B212D11232A",
    "endpoint": "price"
  },
  "debug": {
    "cacheKey": "hgXqzD9ji3qyHVo+vugB/XttLU0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "fee": "0.02",
    "price": "65.319915591679174162",
    "priceWithFee": "66.626313903512757645"
  },
  "statusCode": 200
}
```

---

MIT License
