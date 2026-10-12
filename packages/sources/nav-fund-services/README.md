# NAV_FUND_SERVICES

![1.4.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nav-fund-services/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options |              Default              |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|           |     `API_ENDPOINT`      |                             An API endpoint for Data Provider                             | string |         | `https://api.navfundservices.com` |
|    ✅     |  `API_KEY_${FUND_ID}`   |      The API key for ${FUND_ID} where ${FUND_ID} is the globalFundID input parameter      | string |         |                                   |
|    ✅     | `SECRET_KEY_${FUND_ID}` |    The secret key for ${FUND_ID} where ${FUND_ID} is the globalFundID input parameter     | string |         |                                   |
|           | `BACKGROUND_EXECUTE_MS` | The amount of time the background execute should sleep before performing the next request | number |         |             `300000`              |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |             Name              | Aliases |                                                                                                   Description                                                                                                   |  Type   |                                 Options                                 |        Default        | Depends On | Not Valid With |
| :-------: | :---------------------------: | :-----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------------------------------------------------------------------: | :-------------------: | :--------: | :------------: |
|    ✅     |         globalFundID          |         |                                                                 Used to match API*KEY*${globalFundID} SECRET_KEY_${globalFundID} env variables                                                                  | number  |                                                                         |                       |            |                |
|           |   navDateTimestampTimezone    |         |                                                      timezone for midnight in navDateTimestampMs (e.g. "America/New_York", "America/Los_Angeles", "UTC").                                                       | string  |                                                                         | `America/Los_Angeles` |            |                |
|           |          resultField          |         |                                                                                The field from "data" to return as the "result".                                                                                 | string  | `endingBalance`, `navDateTimestampMs`, `navPerShare`, `nextNavPerShare` |     `navPerShare`     |            |                |
|           | limitToOfficialAccountingDate |         | Whether to cap the queried date range at FundOfficialAccountingLastAvailableDate from GetFundList. Only enable for funds where the provider rejects later dates, as this date can lag the latest available NAV. | boolean |                                                                         |                       |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "globalFundID": 1234,
    "navDateTimestampTimezone": "UTC",
    "resultField": "navPerShare",
    "limitToOfficialAccountingDate": false
  }
}
```

---

MIT License
