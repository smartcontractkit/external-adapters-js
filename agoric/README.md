# Chainlink External Adapter for agoric

## Build Docker Container

```sh
(cd .. && make docker adapter=agoric name=agoric/chainlink)
```

## Input Params

Set the `$AG_SOLO_ORACLE` environment variable to something like: http://localhost:8000/api/oracle

All request data will be passed through verbatim.

- `agoric_oracle_query_id`: The Agoric oracle queryId.  If unset, the result is not
  posted to the Agoric oracle contract
- `result`: The result to return to the Agoric oracle contract


## Output

```json
{
 "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
 "data": <passed through>,
 "statusCode": 200
}
```
