# Chainlink External Adapter for Wrapped

![2.2.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wrapped/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL http://chainlink.wrappedeng.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           | API_ENDPOINT |             |      |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [deposits](#deposits-endpoint) | `deposits` |

## Deposits Endpoint

`deposits` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                                        Description                                         |  Type  | Options |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :-------: | :--------: | :------------: |
|    ✅     | symbol  |         |              The symbol of the currency to query (`BTC`, `ETH`, `LTC`, etc.).              | string |         |           |            |                |
|           | network |         | The network of the currency to query (`ethereum`, `bitcoin`, `litecoin`, `stellar`, etc.). | string |         |           |            |                |
|           | chainId |         |                            The chainId of the currency to query                            | string |         | `mainnet` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
