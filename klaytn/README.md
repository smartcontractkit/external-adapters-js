# Chainlink External Adapter for Klaytn

This adapter is built to fulfill Chainlink oracle requests.

## Configuration

The adapter uses the following environment variables:

- `URL`: A URL to a JSON-RPC (HTTP RPC) node on Klaytn
- `PRIVATE_KEY`: The private key to sign transactions with. Must have fulfillment permissions on the Oracle contract.

## Input Params

- `address` : The oracle contract to fulfill the request on
- `dataPrefix` : The data prefix in the request
- `functionSelector` : The fulfillment function selector
- `result` or `value` : The value to fulfill the request with

## Output
```
{
   "jobRunID":"1",
   "data":{
      "result":"0xf5e2f6cf458ba8aa2676458888bff34536954dfb1e6aa02523d0c1143112761c"
   },
   "result":"0xf5e2f6cf458ba8aa2676458888bff34536954dfb1e6aa02523d0c1143112761c",
   "statusCode":200
}
```