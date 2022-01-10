# Chainlink Lotus Composite Adapter

Version: 2.1.1

An external adapter to interact with the Lotus node API

## Environment Variables

| Required? |  Name   |                                            Description                                             |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | Your Lotus node [API key/token](https://docs.filecoin.io/build/lotus/api-tokens/#obtaining-tokens) | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

---

## Balance Endpoint

Supported names for this endpoint are: `balance`, `Filecoin.WalletBalance`.

### Input Params

| Required? |   Name    | Aliases  |                 Description                  | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to get the balances of | array |         |         |            |                |

There are no examples for this endpoint.
