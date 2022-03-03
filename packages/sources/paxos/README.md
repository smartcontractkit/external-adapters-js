# Chainlink External Adapter for paxos

Version: 1.2.17

Query Paxos asset attestations like: https://api.paxos.com/v1/asset-attestations/PAX

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                  Options                   |      Default       |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [assetAttestation](#attestations-endpoint) | `assetAttestation` |

---

## Attestations Endpoint

`assetAttestation` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | asset |         | The symbol of the currency to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "assetAttestation",
    "asset": "PAX"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 922265979.98
  },
  "result": 922265979.98,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
