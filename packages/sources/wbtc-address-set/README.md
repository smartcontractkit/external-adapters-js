# Chainlink External Adapters for querying wBTC custodial address set

![1.4.38](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wbtc-address-set/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name        |                                  Description                                  |  Type  | Options | Default |
| :-------: | :----------------: | :---------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |  MEMBERS_ENDPOINT  | wBTC endpoint of members (and their addresses). Required for members endpoint | string |         |         |
|           | ADDRESSES_ENDPOINT |          wBTC endpoint of addresses. Required for addresses endpoint          | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                            Options                             |   Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [addresses](#addresses-endpoint), [members](#members-endpoint) | `addresses` |

## Addresses Endpoint

`addresses` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Members Endpoint

`members` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
