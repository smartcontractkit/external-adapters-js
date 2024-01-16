# Chainlink External Adapter for CoinGecko

### Environment Variables

| Required? |     Name     |             Description             | Options | Defaults to |
| :-------: | :----------: | :---------------------------------: | :-----: | :---------: |
|           |   API_KEY    | An optional API key for the Pro API |         |             |
|           | API_ENDPOINT | The HTTP URL to retrieve data from  |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                                                                                                     Options                                                                                                     | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint), [globalmarketcap](#Global-Market-Capitalization-Endpoint), [dominance](#Dominance-Endpoint), [marketcap](#Marketcap-Endpoint), [volume](#Volume-Endpoint), [coins](#Coins-Endpoint) |    price    |

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `crypto-batched`, `batched`, `batch`, `price`

### Input Params

Query the crypto price from [Coingecko](https://api.coingecko.com/api/v3/simple/price)

### Input Params

|         Required?          |            Name            |                                                                  Description                                                                   |                                        Options                                         | Defaults to |
| :------------------------: | :------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------: |
|  (✅ if not using `base`)  |          `coinid`          | The CoinGecko id or array of ids of the coin(s) to query (Note: because of current limitations to use a dummy `base` will need to be supplied) | [See list here](https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list) |             |
| (✅ if not using `coinid`) | `base`, `from`, or `coin`  |                                            The symbol or array of symbols of the currency to query                                             |                                           ↑                                            |             |
|             ✅             | `quote`, `to`, or `market` |                                                    The symbol of the currency to convert to                                                    |                                           ↑                                            |             |
|                            |        `overrides`         |                           If base provided is found in overrides, the coin id specified in `overrides` will be used                            |                         [Format](./src/config/overrides.json)                          |             |

### Sample Input

```json
{
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 4226.71
  },
  "result": 4226.71,
  "statusCode": 200,
  "timestamps": {
    "providerDataReceivedUnixMs": 1652198967193,
    "providerDataRequestedUnixMs": 1652198967193
  }
}
```

## Global Market Capitalization Endpoint

Query the global market cap from [Coingecko](https://api.coingecko.com/api/v3/global)

Supported names for this endpoint are: `globalmarketcap`, `total_market_cap`

### Input Params

| Required? |            Name            |           Description           |                           Options                            | Defaults to |
| :-------: | :------------------------: | :-----------------------------: | :----------------------------------------------------------: | :---------: |
|    ✅     | `market`, `to`, or `quote` | The ticker of the coin to query | [Supported tickers](https://api.coingecko.com/api/v3/global) |             |

### Sample Input

```json
{
  "data": {
    "endpoint": "globalmarketcap",
    "market": "ETH"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 2744386468602.4453
  },
  "result": 2744386468602.4453,
  "statusCode": 200,
  "timestamps": {
    "providerDataReceivedUnixMs": 1652198967193,
    "providerDataRequestedUnixMs": 1652198967193,
    "providerIndicatedTimeUnixMs": 1635189786000
  }
}
```

## Dominance Endpoint

Query the market dominance percentage from [Coingecko](https://api.coingecko.com/api/v3/global)

Supported names for this endpoint are: `dominance`, `market_cap_percentage`

### Input Params

| Required? |            Name            |           Description           |                           Options                            | Defaults to |
| :-------: | :------------------------: | :-----------------------------: | :----------------------------------------------------------: | :---------: |
|    ✅     | `market`, `to`, or `quote` | The ticker of the coin to query | [Supported tickers](https://api.coingecko.com/api/v3/global) |             |

### Sample Input

```json
{
  "data": {
    "endpoint": "dominance",
    "market": "ETH"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 18.127134683884314
  },
  "result": 18.127134683884314,
  "statusCode": 200,
  "timestamps": {
    "providerDataReceivedUnixMs": 1652198967193,
    "providerDataRequestedUnixMs": 1652198967193,
    "providerIndicatedTimeUnixMs": 1635189786000
  }
}
```

## Marketcap Endpoint

Query the Market Cap for the requested assets

Supported names for this endpoint are: `marketcap`, `crypto-marketcap`

### Input Params

|         Required?          |            Name            |                                        Description                                        |                                        Options                                         | Defaults to |
| :------------------------: | :------------------------: | :---------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------: |
|  (✅ if not using `base`)  |          `coinid`          |                           The CoinGecko id of the coin to query                           | [See list here](https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list) |             |
| (✅ if not using `coinid`) | `base`, `from`, or `coin`  |                            The symbol of the currency to query                            |                                           ↑                                            |             |
|             ✅             | `quote`, `to`, or `market` |                      The symbol of the currency to fecth market cap                       |                                           ↑                                            |             |
|                            |        `overrides`         | If base provided is found in overrides, the coin id specified in `overrides` will be used |                         [Format](./src/config/overrides.json)                          |             |

### Sample Input

```json
{
  "data": {
    "endpoint": "marketcap",
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 499351414399.08246
  },
  "result": 499351414399.08246,
  "statusCode": 200,
  "timestamps": {
    "providerDataReceivedUnixMs": 1652198967193,
    "providerDataRequestedUnixMs": 1652198967193
  }
}
```

## Volume Endpoint

Query the volume for the requested assets

Supported names for this endpoint are: `volume`, `crypto-volume`

### Input Params

|         Required?          |            Name            |                                        Description                                        |                                        Options                                         | Defaults to |
| :------------------------: | :------------------------: | :---------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :---------: |
|  (✅ if not using `base`)  |          `coinid`          |                           The CoinGecko id of the coin to query                           | [See list here](https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list) |             |
| (✅ if not using `coinid`) | `base`, `from`, or `coin`  |                            The symbol of the currency to query                            |                                           ↑                                            |             |
|             ✅             | `quote`, `to`, or `market` |                      The symbol of the currency to fecth market cap                       |                                           ↑                                            |             |
|                            |        `overrides`         | If base provided is found in overrides, the coin id specified in `overrides` will be used |                         [Format](./src/config/overrides.json)                          |             |

### Sample Input

```json
{
  "data": {
    "endpoint": "volume",
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "data": {
    "result": 17345604238.153397
  },
  "result": 17345604238.153397,
  "statusCode": 200,
  "timestamps": {
    "providerDataReceivedUnixMs": 1652198967193,
    "providerDataRequestedUnixMs": 1652198967193
  }
}
```

## Coins Endpoint

Supported names for this endpoint are: `coins`.

### Input Params

There are no input parameters for this endpoint.

### Sample Input

```json
{
  "data": {
    "endpoint": "coins"
  }
}
```
