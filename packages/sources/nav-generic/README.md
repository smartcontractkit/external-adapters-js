# NAV_GENERIC

## Environment Variables

Need to be added to support each integration.

| Required? |          Name          |     Description     |  Type  | Options | Default |
| :-------: | :--------------------: | :-----------------: | :----: | :-----: | :-----: |
|    ✅     | {INTEGRATION}\_API_KEY | Integration API key | string |         |         |
|    ✅     | {INTEGRATION}\_API_URL | Integration API url | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |             Note             |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------: |
| default |                             |             20              |                           | Slower than API limit of 1/s |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                   Options                    | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [price](#nav-endpoint) |  `nav`  |

## Nav Endpoint

Supported names for this endpoint are: `nav`, `price`.

### Input Params

| Required? |    Name     | Aliases |       Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | integration |         | The integration to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "integration": "example-integration"
  }
}
```

---

MIT License
