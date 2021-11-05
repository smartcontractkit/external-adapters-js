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

| Required? |   Name   |  Type  |                                         Options                                          | Default |
| :-------: | :------: | :----: | :--------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | string | [balance](#balance-endpoint), [marketcap](#marketcap-endpoint), [price](#price-endpoint) | balance |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Type | Options | Default |
| :-------: | :-----------: | :--: | :-----: | :-----: |
|           |   dataPath    |      |         |         |
|           | confirmations |      |         |         |
|           |   addresses   |      |         |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output

## Marketcap Endpoint

Supported names for this endpoint are: `marketcap`, `mc`.

### Input Params

| Required? |         Name          | Type |      Options      | Default |
| :-------: | :-------------------: | :--: | :---------------: | :-----: |
|    ✅     |         base          |      | base, from, coin  |         |
|    ✅     |         quote         |      | quote, to, market |         |
|    ✅     |        coinid         |      |                   |         |
|           |      resultPath       |      |                   |         |
|           | referenceCurrencyUuid |      |                   |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output

## Price Endpoint

Supported names for this endpoint are: `price`, `convert`.

### Input Params

| Required? |  Name  | Type |      Options      | Default |
| :-------: | :----: | :--: | :---------------: | :-----: |
|    ✅     |  base  |      | base, from, coin  |         |
|    ✅     | quote  |      | quote, to, market |         |
|           | amount |      |                   |         |

### Sample Input

A sample of endpoint input

### Sample Output

A sample of endpoint output
