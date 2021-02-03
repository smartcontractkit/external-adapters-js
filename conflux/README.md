# Chainlink External Adapter for Conflux Network

This adapter is built to fulfill Chainlink oracle requests.

## Configuration

The adapter uses the following environment variables:

- `URL`: A URL to a JSON-RPC (HTTP RPC) node on Conflux Network
- `NETWORK_ID`: networkId of a JSON-RPC (HTTP RPC) node on Conflux Network
- `PRIVATE_KEY`: The private key to sign transactions with. Must have fulfillment permissions on the Oracle contract.
- `EA_PORT`: Configure this parameter to change the EA port

## Input Params

- `address` or `cfxAddress`: The oracle contract to fulfill the request on
- `dataPrefix` or `cfxDataPrefix`: The data prefix in the request
- `functionSelector` or `cfxFunctionSelector`: The fulfillment function selector
- `result` or `value`: The value to fulfill the request with

## Starting Commands (local deployment)
```
node -e "require(\"dotenv\").config() && require(\"./index.js\").server()"
```

## Output

```json
{
    "jobRunID": "test123",
    "data": {
        "result": "0x560d6081e276e1c3c1e58aba722ab2848315442a196fcc89a13baa8bc7e34a78"
    },
    "result": "0x560d6081e276e1c3c1e58aba722ab2848315442a196fcc89a13baa8bc7e34a78",
    "statusCode": 200
}
```
