# @chainlink/snowflake-adapter

Version: 1.0.0

## Environment Variables

| Required? |      Name      | Description |  Type  | Options |          Default           |
| :-------: | :------------: | :---------: | :----: | :-----: | :------------------------: |
|    ✅     |    ACCOUNT     |             | string |         |                            |
|           |  DB_USERNAME   |             | string |         |                            |
|           |    DATABASE    |             | string |         | `COVID19_BY_STARSCHEMA_DM` |
|           |     SCHEMA     |             | string |         |          `PUBLIC`          |
|           |  CLOUD_REGION  |             | string |         |                            |
|           | CLOUD_PROVIDER |             | string |         |                            |
|    ✅     |  PRIVATE_KEY   |             | string |         |                            |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |    Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [covidcases](#covidcases-endpoint) | `covid-cases` |

---

## CovidCases Endpoint

`covid-cases` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases  | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | state  | `state`  |             |      |         |         |            |                |
|    ✅     | county | `county` |             |      |         |         |            |                |

There are no examples for this endpoint.
