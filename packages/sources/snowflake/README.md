# Chainlink External Adapter for Snowflake

![1.1.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/snowflake/package.json)

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "covid-cases",
    "state": "Alabama",
    "county": "Autauga"
  },
  "debug": {
    "cacheKey": "L1/QFC2aiWJ1ikadMBxtZATqGI0="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "resultSetMetaData": {
      "numRows": 1,
      "format": "jsonv2",
      "partitionInfo": [
        {
          "rowCount": 1,
          "uncompressedSize": 9
        }
      ],
      "rowType": [
        {
          "name": "CONFIRMED",
          "database": "test_database",
          "schema": "test_schema",
          "table": "JHU_DASHBOARD_COVID_19_GLOBAL",
          "type": "fixed",
          "byteLength": null,
          "scale": 0,
          "precision": 38,
          "nullable": true,
          "collation": null,
          "length": null
        }
      ]
    },
    "data": [["10531"]],
    "code": "090001",
    "statementStatusUrl": "/api/statements/01a0af11-0000-5d4e-0000-0001316650a5?requestId=e68f6b77-72bd-4b7f-8719-247ac70f6f82",
    "requestId": "e68f6b77-72bd-4b7f-8719-247ac70f6f82",
    "sqlState": "00000",
    "statementHandle": "01a0af12-0000-5d4d-0000-000131664085",
    "message": "Statement executed successfully.",
    "createdOn": 1638467668319,
    "result": 10531
  },
  "result": 10531,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
