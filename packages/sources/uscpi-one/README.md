# Chainlink External Adapter for US Consumer Price Index (USCPI)

Version: 1.1.1

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [series](#series-endpoint) | `series` |

---

## Series Endpoint

`series` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                                                   Description                                                   |  Type  | Options |    Default    | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :-------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----------: | :--------: | :------------: |
|           |   serie    |         |                           The US CPI Data serieID (`CUSR0000SA0`, `LNS14000000`, etc)                           | string |         | `CUSR0000SA0` |            |                |
|           |    year    |         | The year serie filter (`2021`, `2020`, etc). It is mandatory to specify the `month` and `year` values together. | string |         |               |            |                |
|           |   month    |         |  The month serie filter `may`, `july`, etc. It is mandatory to specify the `month` and `year` values together.  | string |         |               |            |                |
|           | resultPath |         |                                                                                                                 | string |         |               |            |                |

There are no examples for this endpoint.
