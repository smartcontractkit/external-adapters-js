# SUPERSTATE

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/superstate/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                     Default                      |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :----------------------------------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://api.superstate.co/v1/funds/1/nav-daily` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |             10              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                  Options                   | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [por](#nav-endpoint) |  `nav`  |

## Nav Endpoint

Supported names for this endpoint are: `nav`, `por`.

### Input Params

| Required? |   Name    | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | startDate |         | Start date  | string |         |         |            |                |
|           |  endDate  |         |  End date   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "startDate": "2024-05-01",
    "endDate": "2024-05-07"
  }
}
```

</details>

---

MIT License
