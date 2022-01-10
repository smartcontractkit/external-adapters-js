# Chainlink External Adapter for Wrapped

Version: 2.1.1

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [deposits](#deposits-endpoint) | `deposits` |

---

## Deposits Endpoint

`deposits` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                                        Description                                         |  Type  | Options |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :-------: | :--------: | :------------: |
|    ✅     | symbol  |         |              The symbol of the currency to query (`BTC`, `ETH`, `LTC`, etc.).              | string |         |           |            |                |
|           | network |         | The network of the currency to query (`ethereum`, `bitcoin`, `litecoin`, `stellar`, etc.). | string |         |           |            |                |
|           | chainId |         |                            The chainId of the currency to query                            | string |         | `mainnet` |            |                |

There are no examples for this endpoint.
