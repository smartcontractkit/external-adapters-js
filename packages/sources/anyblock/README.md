# Chainlink External Adapter for Blockdaemon (Anyblock Analytics)

### Environment Variables

The adapter takes the following environment variables:

| Required? |   Name    |        Description         | Options | Defaults to |
| :-------: | :-------: | :------------------------: | :-----: | :---------: |
|           | `API_KEY` | Blockdaemon API key to use |         |             |

You can create a free API-Key at https://app.blockdaemon.com/signin/register

### Input Parameters

| Required? |    Name    |     Description     |             Options             | Defaults to |
| :-------: | :--------: | :-----------------: | :-----------------------------: | :---------: |
|           | `endpoint` | The endpoint to use | [gasprice](#Gas-Price-Endpoint) | `gasprice`  |

---

## Gas Price Endpoint

### Input Params

| Required? |  Name   |    Description    |              Options               | Defaults to |
| :-------: | :-----: | :---------------: | :--------------------------------: | :---------: |
|    🟡     | `speed` | The desired speed | `slow`,`standard`,`fast`,`instant` | `standard`  |

### Output

```json
{
  "jobRunID": 1,
  "result": 37465992063,
  "providerStatusCode": 200,
  "statusCode": 200,
  "data": {
    "result": 37465992063
  },
  "metricsMeta": {
    "feedId": "{\"data\":{\"speed\":\"standard\",\"endpoint\":\"gasprice\"}}"
  }
}
```
