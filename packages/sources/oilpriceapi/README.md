# Chainlink OilpriceAPI External Adapter

Version: 2.0.1

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |              Aliases              |              Description              | Type |       Options        |     Default     | Depends On | Not Valid With |
| :-------: | :--: | :-------------------------------: | :-----------------------------------: | :--: | :------------------: | :-------------: | :--------: | :------------: |
|    ✅     | base | `type`, `asset`, `from`, `market` | The type of oil to get the price from |      | `bz`, `brent`, `wti` |                 |            |                |
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
  "rateLimitMaxAge": 292184
}
```

Response:

```json
{
  "result": 70.71
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
  "rateLimitMaxAge": 584368
}
```

Response:

```json
{
  "result": 71.47
}
```

</details>
