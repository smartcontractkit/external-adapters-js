# Chainlink External Adapter for agoric

## Build Docker Container

```sh
(cd .. && make docker adapter=agoric tag=agoric/chainlink-adapter)
docker push agoric/chainlink-adapter:latest
```

## Input Params

Set the `$AG_SOLO_ORACLE` environment variable to something like: http://localhost:8000/api/oracle

- `request_id`: The Agoric oracle queryId
- `payment`: The user-provided fee in $LINK
- `result`: The result to return to the Agoric oracle contract

## Output

```json
{
 "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
 "data": { "result": "..." },
 "statusCode": 200
}
```
