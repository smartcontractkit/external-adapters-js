# Chainlink External Adapter for Agoric

This adapter posts a result to the [Agoric blockchain](https://agoric.com).  See
the [Agoric Chainlink Oracle
integration](https://github.com/Agoric/dapp-oracle/tree/master/chainlink-agoric)
for details on how to use it with your Chainlink node.

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
