# Chainlink External Adapter for trueusd

## Total Supply API

https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD

## Input Params

- `field`: Required, the data field to return. Must be in camel-case style.

## Output

```json
{ "field": "totalTrust" }
```

```json
{
  "jobRunID": "1",
  "data": {
    "responseData": {
      "accountName": "TrueUSD",
      "totalTrust": 347215038.53,
      "totalToken": 343465335.4587567,
      "updatedAt": "2020-10-16T22:02:31.560Z",
      "token": [
        { "tokenName": "TUSDB", "principle": 4766109.0487567 },
        { "tokenName": "TUSD", "principle": 338699226.40999997 }
      ]
    },
    "message": [{ "msg": "get contractSupply successfully" }],
    "success": true,
    "responseCode": 200,
    "result": 343465335.4587567
  },
  "result": 343465335.4587567,
  "statusCode": 200
}
```
