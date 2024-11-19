# STARKNET_GAS_PRICE

![1.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/starknet-gas-price/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   STARKNET_RPC_URL    |                                   RPC Url For Starknet                                    | string |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                             Options                             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gas_price](#gasprice-endpoint), [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

Supported names for this endpoint are: `gas_price`, `gasprice`.

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
