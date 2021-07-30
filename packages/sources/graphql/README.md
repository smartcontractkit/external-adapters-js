# Chainlink External Adapter for GraphQL

### Environment Variables

No adapter specific environment variables required

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|    ✅        | graphqlEndpoint | The GraphQL endpoint to make a request to | (#Graphql-Endpoint) |      |

---

## Graphql Endpoint

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `query`  |   The GraphQL query as a string   |                                    |             |
|         | `variables` | An object of variables to be passed into the query  |  |             |

### Sample Input

```json
{
    "jobRunId": 1,
    "data": {
        "query":"{\n  token(id:\"0x00000000000045166c45af0fc6e4cf31d9e14b9a\") {\n    id,\n    symbol\n  }\n}\n",
        "variables": null,
        "graphqlEndpoint": "https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph"
    }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": {
        "data": {
            "token": {
                "id": "0x00000000000045166c45af0fc6e4cf31d9e14b9a",
                "symbol": "BID"
            }
        }
    },
    "statusCode": 200,
    "data": {
        "result": {
            "data": {
                "token": {
                    "id": "0x00000000000045166c45af0fc6e4cf31d9e14b9a",
                    "symbol": "BID"
                }
            }
        }
    }
}
```
