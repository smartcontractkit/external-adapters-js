# Chainlink External Adapter for Snowflake

![1.2.29](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/snowflake/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Adapter to query data from [Snowflake](https://www.snowflake.com/). Currently only contains an endpoint to query US confirmed Covid cases per County.
To setup the environment, here are additional docs to [assign a key pair to a user](https://docs.snowflake.com/en/developer-guide/sql-api/guide.html#using-key-pair-authentication) and [finding your account identifier](https://docs.snowflake.com/en/user-guide/admin-account-identifier.html).

Queries US confirmed Covid cases per County, using the John Hopkins University table from the [StarSchema COVID-19 Epidemiological dataset](https://www.snowflake.com/datasets/starschema-covid-19-epidemiological-data/).

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name      |                                Description                                |  Type  | Options |          Default           |
| :-------: | :------------: | :-----------------------------------------------------------------------: | :----: | :-----: | :------------------------: |
|    ✅     |    ACCOUNT     |                Unique identifier for the Snowflake account                | string |         |                            |
|    ✅     |  DB_USERNAME   |                         Name of the database user                         | string |         |                            |
|           |    DATABASE    |                    Name of the database to connect to                     | string |         | `COVID19_BY_STARSCHEMA_DM` |
|           |     SCHEMA     |             Database schema where the main tables are located             | string |         |          `PUBLIC`          |
|           |  CLOUD_REGION  |        Shortcut for the designated cloud region (e.g. 'us-east-2')        | string |         |                            |
|           | CLOUD_PROVIDER |           Shortcut for the selected cloud provider (e.g. 'aws')           | string |         |                            |
|    ✅     |  PRIVATE_KEY   | Private PKCS PEM Key matching assigned public key for a user in Snowflake | string |         |                            |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |               Options               |    Default    |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [covid-cases](#covidcases-endpoint) | `covid-cases` |

## CovidCases Endpoint

Queries US confirmed Covid cases per County, using the John Hopkins University table from the [StarSchema COVID-19 Epidemiological dataset](https://www.snowflake.com/datasets/starschema-covid-19-epidemiological-data/).

`covid-cases` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :-----------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | state  |         | The state of the desired county | string |         |         |            |                |
|    ✅     | county |         |   Name of the desired county    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
