# DLC_CBTC_POR

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dlc-cbtc-por/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                             Description                             |  Type  |                       Options                       |     Default      |
| :-------: | :-------------------: | :-----------------------------------------------------------------: | :----: | :-------------------------------------------------: | :--------------: |
|    ✅     |   ATTESTER_API_URLS   |         Comma-separated list of DLC.Link Attester API URLs          | string |                                                     |                  |
|           |    CANTON_API_URL     |       Digital Asset API endpoint URL for CBTC token metadata        | string |                                                     |                  |
|           |      CHAIN_NAME       |          Chain name to filter addresses from Attester API           |  enum  | `canton-devnet`, `canton-mainnet`, `canton-testnet` | `canton-mainnet` |
|    ✅     | BITCOIN_RPC_ENDPOINT  | Electrs-compatible Bitcoin blockchain API endpoint for UTXO queries | string |                                                     |                  |
|           | BACKGROUND_EXECUTE_MS |       Interval in milliseconds between background executions        | number |                                                     |     `10000`      |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                Options                                                                |     Default      |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------: | :--------------: |
|           | endpoint | The endpoint to use | string | [attestersupply](#attestersupply-endpoint), [dasupply](#dasupply-endpoint), [por](#reserves-endpoint), [reserves](#reserves-endpoint) | `attestersupply` |

## Attestersupply Endpoint

`attestersupply` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "attestersupply"
  }
}
```

---

## Dasupply Endpoint

`dasupply` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "dasupply"
  }
}
```

---

## Reserves Endpoint

Supported names for this endpoint are: `por`, `reserves`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves"
  }
}
```

---

MIT License
