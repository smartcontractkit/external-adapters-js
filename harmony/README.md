# Chainlink External Adapter for Harmony
This adapter is built to fulfill Chainlink oracle requests.
## Configurations
The adapter uses the following environment variables
* API_ENDPOINT: a URL to a JSON-RPC (HTTP RPC) node on Harmony, default: `https://api.s0.t.hmny.io`
* CHAIN_ID: Harmony network chain id, default: `1 (mainnet)`
* GAS_LIMIT: gaslimit to use, default: `6721900`
* PRIVATE_KEY: user private key for signing the contract transaction

## Input Params

* address: the oracle contract to fulfill the request on
* functionSelector: the fulfillment function selector
* dataPrefix: the data prefix in the request
* result or dataToSend: the value to fulfill the request with

## Output

```json
{
    "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
    "data": {
    "result": "0x5e28750a948df26931daa3c01cc3669847936d19e04b40a6819df6bef2b8827d"
    },
    "result": "0x5e28750a948df26931daa3c01cc3669847936d19e04b40a6819df6bef2b8827d",
    "statusCode": 200
}
```
