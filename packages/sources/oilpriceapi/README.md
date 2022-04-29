# Chainlink OilpriceAPI External Adapter

![2.0.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/oilpriceapi/package.json)

Base URL https://api.oilpriceapi.com/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |              Aliases              |              Description              | Type |       Options        |     Default     | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------------------------: | :--: | :------------------: | :-------------: | :--------: | :------------: |
|    ✅     | base | `asset`, `from`, `market`, `type` | The type of oil to get the price from |      | `brent`, `bz`, `wti` |                 |            |                |
|           | url  |                                   |          The endpoint to use          |      |                      | `prices/latest` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "bz",
    "url": "prices/latest"
  },
  "debug": {
    "cacheKey": "RPRR3Z04AWc/TGtHftP/S/2ByRc="
  },
  "rateLimitMaxAge": 292184
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 70.71
  },
  "result": 70.71,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "wti",
    "url": "prices/latest"
  },
  "debug": {
    "cacheKey": "l95L0aoLWaAHs3sTSB6amSkhM1w="
  },
  "rateLimitMaxAge": 584368
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 71.47
  },
  "result": 71.47,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
