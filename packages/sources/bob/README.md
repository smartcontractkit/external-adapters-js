# Chainlink External Adapter for BOB

![2.0.9](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bob/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The adapter provides an interface for retrieving data from the source blockchain.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name   |        Description         |  Type  | Options | Default |
| :-------: | :------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL  |  Blockchain RPC endpoint   | string |         |         |
|           | CHAIN_ID | The chain id to connect to | string |         |   `1`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [format](#format-endpoint) | `format` |

## Format Endpoint

The format endpoint encodes the chainId, block hash, and block receiptsRoot as bytes and returns that without a 0x prefix.

`format` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                       Description                        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           |   chainId   |         | An identifier for which network of the blockchain to use |      |         |         |            |                |
|    ✅     | blockNumber |         |                Block number to query for                 |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
