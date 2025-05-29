# Chainlink bSOL Price Composite Adapter

![2.2.125](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/bsol-price/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                           Description                            |  Type  | Options | Default |
| :-------: | :---------------------: | :--------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |      BSOL_ADDRESS       |                 The address of the bSOL contract                 | string |         |         |
|           |     SOLIDO_ADDRESS      |                The address of the Solido contract                | string |         |         |
|           | SOLIDO_CONTRACT_VERSION | The Solido contract version that is deployed to `SOLIDO_ADDRESS` | string |         |         |
|           |      STSOL_ADDRESS      |                The address of the stSOL contract                 | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           |   source    |         |             |      |         |         |            |                |
|           | allocations |         |             |      |         |         |            |                |
|           |    quote    |         |             |      |         |         |            |                |
|           |   method    |         |             |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
