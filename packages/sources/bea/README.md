# Chainlink External Adapter for Bea

Version: 1.1.1

## Environment Variables

| Required? |  Name   |                            Description                             |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [average](#average-endpoint) | `average` |

---

## Average Endpoint

`average` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |                     Description                     |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :-------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|           | series |         | The series code to query (`DGDSRG`, `DPCERG`, etc.) | string |         | `DPCERG` |            |                |
|           |  last  |         |             The last N months to query              | number |         |   `3`    |            |                |

There are no examples for this endpoint.
