# @chainlink/readme-test-adapter

Version: 1.2.3

## Environment Variables

| Required? |     Name     |  Type  |       Options       |            Default             |
| :-------: | :----------: | :----: | :-----------------: | :----------------------------: |
|           | API_ENDPOINT | string |                     | https://test.api.endpoint.link |
|           |   CHAIN_ID   | number |                     |               1                |
|           |     MODE     | string | live, sandbox, test |            sandbox             |
|    ✅     | PRIVATE_KEY  | string |                     |                                |
|    ✅     |   RPC_URL    | string |                     |                                |

---

## Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [example](#Example-Endpoint) |   example   |

---

## Balance Endpoint

Example description of balance endpoint

### Input Params

| Required? |            Name            |                 Type                 |       Options       | Default |
| :-------: | :------------------------: | :----------------------------------: | :-----------------: | :-----: |
|    ✅     | `base`, `from`, or `coin`  |   Symbol of the currency to query    | `BTC`, `ETH`, `USD` |         |
|    ✅     | `quote`, `to`, or `market` | Symbol of the currency to convert to | `BTC`, `ETH`, `USD` |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output

## Marketcap Endpoint

Example description of marketcap endpoint

### Input Params

| Required? |            Name            |                 Type                 |       Options       | Default |
| :-------: | :------------------------: | :----------------------------------: | :-----------------: | :-----: |
|    ✅     | `base`, `from`, or `coin`  |   Symbol of the currency to query    | `BTC`, `ETH`, `USD` |         |
|    ✅     | `quote`, `to`, or `market` | Symbol of the currency to convert to | `BTC`, `ETH`, `USD` |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output

## Price Endpoint

Example description of price endpoint

### Input Params

| Required? |            Name            |                 Type                 |       Options       | Default |
| :-------: | :------------------------: | :----------------------------------: | :-----------------: | :-----: |
|    ✅     | `base`, `from`, or `coin`  |   Symbol of the currency to query    | `BTC`, `ETH`, `USD` |         |
|    ✅     | `quote`, `to`, or `market` | Symbol of the currency to convert to | `BTC`, `ETH`, `USD` |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output
