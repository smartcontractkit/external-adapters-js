# STARKNET_GAS_PRICE

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/starknet-gas-price/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default  |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------: |
|    ✅     |   STARKNET_RPC_URL    |                          The RPC URL used to fetch the gas price                          | string |         |          |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | string |         | `10_000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "gasprice"
  }
}
```

---

MIT License
