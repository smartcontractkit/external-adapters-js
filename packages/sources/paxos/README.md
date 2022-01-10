# Chainlink External Adapter for paxos

Version: 1.2.1

Query Paxos asset attestations like: https://api.paxos.com/v1/asset-attestations/PAX

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                Options                 |      Default       |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [attestations](#attestations-endpoint) | `assetAttestation` |

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
  "result": 922265979.98
}
```
