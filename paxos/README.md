# Chainlink External Adapter for paxos

Query Paxos asset attestations like: https://api.paxos.com/v1/asset-attestations/PAX

## Input Params

- `asset`: The symbol of the currency to query

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "asset": "PAX",
    "auditorName": "withum",
    "lastAttestedAt": "2020-11-30T17:00:00.00-05:00",
    "amount": 404707843.4,
    "verified": true,
    "result": 404707843.4
  },
  "result": 404707843.4,
  "statusCode": 200
}
```
