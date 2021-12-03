# Chainlink External Adapter for Snowflake

Adapter to query data from [Snowflake](https://www.snowflake.com/). Currently only contains an endpoint to query US confirmed Covid cases per County.
To setup the environment, here are additional docs to [assign a key pair to a user](https://docs.snowflake.com/en/developer-guide/sql-api/guide.html#using-key-pair-authentication) and [finding your account identifier](https://docs.snowflake.com/en/user-guide/admin-account-identifier.html).

### Environment Variables

| Required? |    Name     |                                Description                                | Options |       Defaults to        |
| :-------: | :---------: | :-----------------------------------------------------------------------: | :-----: | :----------------------: |
|    ✅     | PRIVATE_KEY | Private PKCS PEM Key matching assigned public key for a user in Snowflake |         |                          |
|    ✅     |   ACCOUNT   |                Unique identifier for the Snowflake account                |         |                          |
|    ✅     | DB_USERNAME |                         Name of the database user                         |         |                          |
|           |  DATABASE   |                    Name of the database to connect to                     |         | COVID19_BY_STARSCHEMA_DM |
|           |   SCHEMA    |             Database schema where the main tables are located             |         |          PUBLIC          |
|           |  PROVIDER   |           Shortcut for the selected cloud provider (e.g. 'aws')           |         |                          |
|           |   REGION    |        Shortcut for the designated cloud region (e.g. 'us-east-2')        |         |                          |

---

### Input Parameters

| Required? |   Name   |     Description     |                    Options                     | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [covid-cases](#Confirmed-Covid-Cases-Endpoint) | covid-cases |

---

## Confirmed Covid Cases Endpoint

Queries US confirmed Covid cases per County, using the John Hopkins University table from the [StarSchema COVID-19 Epidemiological dataset](https://www.snowflake.com/datasets/starschema-covid-19-epidemiological-data/).

### Input Params

| Required? |   Name   |           Description           | Options | Defaults to |
| :-------: | :------: | :-----------------------------: | :-----: | :---------: |
|    ✅     | `state`  | The state of the desired county |         |             |
|    ✅     | `county` |   Name of the desired county    |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "state": "Alabama",
    "county": "Autauga"
  }
}
```

### Sample Output

```json
{
  "data": {
    "code": "090001",
    "createdOn": 1638467668319,
    "data": [["10531"]],
    "message": "Statement executed successfully.",
    "requestId": "e68f6b77-72bd-4b7f-8719-247ac70f6f82",
    "result": 10531,
    "resultSetMetaData": {
      "format": "jsonv2",
      "numRows": 1,
      "partitionInfo": [
        {
          "rowCount": 1,
          "uncompressedSize": 9
        }
      ],
      "rowType": [
        {
          "byteLength": null,
          "collation": null,
          "database": "test_database",
          "length": null,
          "name": "CONFIRMED",
          "nullable": true,
          "precision": 38,
          "scale": 0,
          "schema": "test_schema",
          "table": "JHU_DASHBOARD_COVID_19_GLOBAL",
          "type": "fixed"
        }
      ]
    },
    "sqlState": "00000",
    "statementHandle": "01a0af12-0000-5d4d-0000-000131664085",
    "statementStatusUrl": "/api/statements/01a0af11-0000-5d4e-0000-0001316650a5?requestId=e68f6b77-72bd-4b7f-8719-247ac70f6f82"
  },
  "jobRunID": "1",
  "result": 10531,
  "statusCode": 200
}
```
