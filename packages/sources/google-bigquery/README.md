# Chainlink External Adapter for Google BigQuery

An adapter to run queries on [Google BigQuery](https://cloud.google.com/bigquery).

### Environment Variables

For more information on configuration variables specific to Google BigQuery, please see their documentation:
https://googleapis.dev/nodejs/bigquery/latest/global.html#BigQueryOptions

| Required? |     Name     |                   Description                    | Options | Defaults to |
| :-------: | :----------: | :----------------------------------------------: | :-----: | :---------: |
|           |  PROJECT_ID  |         See Google's docs for more info          |         |             |
|           | KEY_FILENAME |         See Google's docs for more info          |         |             |
|           |  AUTO_RETRY  | See Google's docs for more info. Default: `true` |         |             |
|           | MAX_RETRIES  |  See Google's docs for more info. Default: `3`   |         |             |
|           |   LOCATION   |         See Google's docs for more info          |         |             |

---

### Input Parameters

| Required? |  Name  |                                                                  Description                                                                   | Options | Defaults to |
| :-------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | query  |                                                                The query to run                                                                |         |             |
|           | params | Optional params to use in the query. [See Google BigQuery's documentation](https://googleapis.dev/nodejs/bigquery/latest/BigQuery.html#query). |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "query": "SELECT url FROM `publicdata.samples.github_nested` WHERE repository.owner = @owner",
    "params": {
      "owner": "google"
    }
  }
}
```
