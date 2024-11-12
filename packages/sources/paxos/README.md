# Chainlink External Adapter for paxos

![1.4.28](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/paxos/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Query Paxos asset attestations like: https://api.paxos.com/v1/asset-attestations/PAX

Base URL https://api.paxos.com/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                  Options                   |      Default       |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :----------------: |
|           | endpoint | The endpoint to use | string | [assetAttestation](#attestations-endpoint) | `assetAttestation` |

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
    "asset": "PAX",
    "endpoint": "assetAttestation"
  },
  "debug": {
    "cacheKey": "FugaCEntMho9fChQ+TsLcf/O1a8="
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

MIT License
