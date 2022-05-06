# Chainlink External Adapter for Wrapped

![2.1.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wrapped/package.json)

Base URL http://chainlink.wrappedeng.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           | API_ENDPOINT |             |      |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [deposits](#deposits-endpoint) | `deposits` |

## Deposits Endpoint

`deposits` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                                        Description                                         |  Type  | Options |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :-------: | :--------: | :------------: |
|    ✅     | symbol  |         |              The symbol of the currency to query (`BTC`, `ETH`, `LTC`, etc.).              | string |         |           |            |                |
|           | network |         | The network of the currency to query (`ethereum`, `bitcoin`, `litecoin`, `stellar`, etc.). | string |         |           |            |                |
|           | chainId |         |                            The chainId of the currency to query                            | string |         | `mainnet` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "deposits",
    "symbol": "ETH",
    "chainId": "mainnet"
  },
  "debug": {
    "cacheKey": "AfHCAiARodF3nQSKihXh2LjDMl0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677",
        "network": "ethereum",
        "chainId": "mainnet"
      }
    ]
  },
  "result": [
    {
      "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677",
      "network": "ethereum",
      "chainId": "mainnet"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
