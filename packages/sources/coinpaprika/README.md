# COINPAPRIKA

![2.1.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                      Description                      |  Type   | Options |                 Default                 |
| :-------: | :-------------: | :---------------------------------------------------: | :-----: | :-----: | :-------------------------------------: |
|           |  API_ENDPOINT   |          The HTTP URL to retrieve data from           | string  |         |                                         |
|           |     API_KEY     |              An API key for Coinpaprika               | string  |         |                                         |
|           | WS_API_ENDPOINT |          The WS API endpoint for Coinpaprika          | string  |         | `wss://streaming.coinpaprika.com/ticks` |
|           |   WS_ENABLED    | Whether data should be returned from websocket or not | boolean |         |                 `false`                 |

---

## Data Provider Rate Limits

|    Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |         Note         |
| :--------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------: |
|    free    |             10              |                             |           69.44           |   50k/mo for free    |
|    pro     |             10              |                             |          347.22           |   250k/mo for pro    |
|  business  |             10              |                             |         1388.888          | 1mil/mo for business |
| enterprise |             10              |                             |                           | unlimited per month  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                          Options                                                                                                                                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#globalmarketcap-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#marketcap-endpoint), [price](#crypto-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? |    Name    |    Aliases     |                                      Description                                       |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------------------------------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |                     The symbol of symbols of the currency to query                     | string |                                     |         |            |                |
|    ✅     |   quote    | `market`, `to` |                        The symbol of the currency to convert to                        | string |                                     |         |            |                |
|           |   coinid   |                |                    The coin ID (optional to use in place of `base`)                    | string |                                     |         |            |                |
|           | resultPath |                | The path to the result within the asset quote in the provider response (only for REST) | string | `market_cap`, `price`, `volume_24h` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "AAAA",
    "coinid": "eth-ethereum",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "USD",
    "resultPath": "volume_24h"
  }
}
```

</details>

---

## Globalmarketcap Endpoint

Supported names for this endpoint are: `dominance`, `globalmarketcap`.

### Input Params

| Required? |    Name    |    Aliases    |                              Description                               |  Type  |                Options                 | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----------: | :--------------------------------------------------------------------: | :----: | :------------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |   market   | `quote`, `to` |                The symbol of the currency to convert to                | string |                                        |         |            |                |
|           | resultPath |               | The path to the result within the asset quote in the provider response | string | `_dominance_percentage`, `market_cap_` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "globalmarketcap",
    "market": "USD",
    "resultPath": "market_cap_"
  }
}
```

---

## Coins Endpoint

`coins` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "coins"
  }
}
```

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |  The symbol of symbols of the currency to query  | string |         |         |            |                |
|           | hours  |                |         Number of hours to get VWAP for          | number |         |  `24`   |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "vwap",
    "base": "ETH",
    "hours": 24
  }
}
```

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    |    Aliases     |                                      Description                                       |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------------------------------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |                     The symbol of symbols of the currency to query                     | string |                                     |         |            |                |
|    ✅     |   quote    | `market`, `to` |                        The symbol of the currency to convert to                        | string |                                     |         |            |                |
|           |   coinid   |                |                    The coin ID (optional to use in place of `base`)                    | string |                                     |         |            |                |
|           | resultPath |                | The path to the result within the asset quote in the provider response (only for REST) | string | `market_cap`, `price`, `volume_24h` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "volume",
    "base": "AAAA",
    "coinid": "eth-ethereum",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "volume",
    "base": "ETH",
    "quote": "USD",
    "resultPath": "volume_24h"
  }
}
```

</details>

---

## Marketcap Endpoint

`marketcap` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    |    Aliases     |                                      Description                                       |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------------------------------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |                     The symbol of symbols of the currency to query                     | string |                                     |         |            |                |
|    ✅     |   quote    | `market`, `to` |                        The symbol of the currency to convert to                        | string |                                     |         |            |                |
|           |   coinid   |                |                    The coin ID (optional to use in place of `base`)                    | string |                                     |         |            |                |
|           | resultPath |                | The path to the result within the asset quote in the provider response (only for REST) | string | `market_cap`, `price`, `volume_24h` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "marketcap",
    "base": "AAAA",
    "coinid": "eth-ethereum",
    "quote": "USD",
    "resultPath": "price"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "marketcap",
    "base": "ETH",
    "quote": "USD",
    "resultPath": "volume_24h"
  }
}
```

</details>

---

MIT License
