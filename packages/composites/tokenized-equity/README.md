# TOKENIZED_EQUITY

![1.5.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/tokenized-equity/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |              Name               |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-----------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |    `DATA_ENGINE_ADAPTER_URL`    |                                   URL of data engine ea                                   | string |         |         |
|    ✅     |   `TRADING_HOURS_ADAPTER_URL`   |                                  URL of tradinghours ea                                   | string |         |         |
|           |       `ETHEREUM_RPC_URL`        |                               RPC URL of a Mainnet ETH node                               | string |         |   ``    |
|           |     `ETHEREUM_RPC_CHAIN_ID`     |                                The chain id to connect to                                 | number |         |   `1`   |
|           |         `BASE_RPC_URL`          |                              RPC URL of a Mainnet Base node                               | string |         |   ``    |
|           |       `BASE_RPC_CHAIN_ID`       |                                The chain id to connect to                                 | number |         | `8453`  |
|    ✅     | `ROBINHOOD_${NETWORK}_RPC_URL`  |     JSON RPC URL for robinhood endpoint. ${NETWORK} should be "mainnet" or "testnet".     | string |         |         |
|    ✅     | `ROBINHOOD_${NETWORK}_CHAIN_ID` |      Chain ID for the Robinhood chain. ${NETWORK} should be "mainnet" or "testnet".       | number |         |         |
|           |     `BACKGROUND_EXECUTE_MS`     | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                             Options                                                                                              | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [coinbase](#coinbase-endpoint), [issuer-price-247](#issuer-price-247-endpoint), [ondo](#ondo-endpoint), [price](#price-endpoint), [robinhood](#robinhood-endpoint), [xstocks](#xstocks-endpoint) | `price` |

## Coinbase Endpoint

`coinbase` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases |                                                                                          Description                                                                                           |   Type   |         Options         | Default  | Depends On | Not Valid With |
| :-------: | :----------------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------: | :------: | :--------: | :------------: |
|    ✅     |            registry            |         |                                                                               Coinbase on-chain registry address                                                                               |  string  |                         |          |            |                |
|    ✅     |             asset              |         |                                                      Unique identifier of the underlying asset. Used to maintain smoother internal state.                                                      |  string  |                         |          |            |                |
|           |        regularStreamId         |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |        extendedStreamId        |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |       overnightStreamId        |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                         |          |            |                |
|           | overnightStreamMaxAgeInSeconds |         |              Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.              |  number  |                         |          |            |                |
|           |         sessionMarket          |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                         |          |            |                |
|           |       sessionMarketType        |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                         |          |            |                |
|           |       sessionBoundaries        |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                         |          |            |                |
|           |   sessionBoundariesTimeZone    |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                         |          |            |                |
|           |            smoother            |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman`, `none` | `kalman` |            |                |
|           |            decimals            |         |                                                                                   Decimals of output result                                                                                    |  number  |                         |   `8`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "coinbase",
    "registry": "0x0",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
    "overnightStreamMaxAgeInSeconds": 100,
    "sessionMarket": "nyse",
    "sessionMarketType": "24/5",
    "sessionBoundaries": ["04:00", "16:00", "20:00"],
    "sessionBoundariesTimeZone": "America/New_York",
    "smoother": "kalman",
    "decimals": 8
  }
}
```

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases |                                                                                          Description                                                                                           |   Type   |         Options         | Default  | Depends On | Not Valid With |
| :-------: | :----------------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------: | :------: | :--------: | :------------: |
|    ✅     |             asset              |         |                                                      Unique identifier of the underlying asset. Used to maintain smoother internal state.                                                      |  string  |                         |          |            |                |
|           |        regularStreamId         |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |        extendedStreamId        |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |       overnightStreamId        |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                         |          |            |                |
|           | overnightStreamMaxAgeInSeconds |         |              Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.              |  number  |                         |          |            |                |
|           |         sessionMarket          |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                         |          |            |                |
|           |       sessionMarketType        |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                         |          |            |                |
|           |       sessionBoundaries        |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                         |          |            |                |
|           |   sessionBoundariesTimeZone    |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                         |          |            |                |
|           |            smoother            |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman`, `none` | `kalman` |            |                |
|           |            decimals            |         |                                                                                   Decimals of output result                                                                                    |  number  |                         |   `8`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
    "overnightStreamMaxAgeInSeconds": 100,
    "sessionMarket": "nyse",
    "sessionMarketType": "24/5",
    "sessionBoundaries": ["04:00", "16:00", "20:00"],
    "sessionBoundariesTimeZone": "America/New_York",
    "smoother": "kalman",
    "decimals": 8
  }
}
```

---

## Ondo Endpoint

`ondo` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases |                                                                                          Description                                                                                           |   Type   |         Options         | Default  | Depends On | Not Valid With |
| :-------: | :----------------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------: | :------: | :--------: | :------------: |
|    ✅     |            registry            |         |                                                                                 Ondo on-chain registry address                                                                                 |  string  |                         |          |            |                |
|    ✅     |             asset              |         |                                                      Unique identifier of the underlying asset. Used to maintain smoother internal state.                                                      |  string  |                         |          |            |                |
|           |        regularStreamId         |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |        extendedStreamId        |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |       overnightStreamId        |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                         |          |            |                |
|           | overnightStreamMaxAgeInSeconds |         |              Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.              |  number  |                         |          |            |                |
|           |         sessionMarket          |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                         |          |            |                |
|           |       sessionMarketType        |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                         |          |            |                |
|           |       sessionBoundaries        |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                         |          |            |                |
|           |   sessionBoundariesTimeZone    |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                         |          |            |                |
|           |            smoother            |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman`, `none` | `kalman` |            |                |
|           |            decimals            |         |                                                                                   Decimals of output result                                                                                    |  number  |                         |   `8`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "ondo",
    "registry": "0x0",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
    "overnightStreamMaxAgeInSeconds": 100,
    "sessionMarket": "nyse",
    "sessionMarketType": "24/5",
    "sessionBoundaries": ["04:00", "16:00", "20:00"],
    "sessionBoundariesTimeZone": "America/New_York",
    "smoother": "kalman",
    "decimals": 8
  }
}
```

---

## Robinhood Endpoint

`robinhood` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases |                                                                                          Description                                                                                           |   Type   |         Options         |  Default  | Depends On | Not Valid With |
| :-------: | :----------------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------: | :-------: | :--------: | :------------: |
|    ✅     |             asset              |         |                                                                       Token address of the asset on the Robinhood chain                                                                        |  string  |                         |           |            |                |
|           |        regularStreamId         |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                         |           |            |                |
|           |        extendedStreamId        |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                         |           |            |                |
|           |       overnightStreamId        |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                         |           |            |                |
|           | overnightStreamMaxAgeInSeconds |         |              Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.              |  number  |                         |           |            |                |
|           |         sessionMarket          |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                         |           |            |                |
|           |       sessionMarketType        |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                         |           |            |                |
|           |       sessionBoundaries        |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                         |           |            |                |
|           |   sessionBoundariesTimeZone    |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                         |           |            |                |
|           |            smoother            |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman`, `none` | `kalman`  |            |                |
|           |            decimals            |         |                                                                                   Decimals of output result                                                                                    |  number  |                         |    `8`    |            |                |
|           |            network             |         |                                       Identifier to determine which RPC URL to use. Corresponds to ROBINHOOD\_${NETWORK}\_RPC_URL environment variable.                                        |  string  |                         | `mainnet` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "robinhood",
    "network": "mainnet",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
    "overnightStreamMaxAgeInSeconds": 100,
    "sessionMarket": "nyse",
    "sessionMarketType": "24/5",
    "sessionBoundaries": ["04:00", "16:00", "20:00"],
    "sessionBoundariesTimeZone": "America/New_York",
    "smoother": "kalman",
    "decimals": 8
  }
}
```

---

## Xstocks Endpoint

`xstocks` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases |                                                                                          Description                                                                                           |   Type   |         Options         | Default  | Depends On | Not Valid With |
| :-------: | :----------------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------: | :------: | :--------: | :------------: |
|    ✅     |             asset              |         |                                                                     Token address of the Xstocks asset on Ethereum Mainnet                                                                     |  string  |                         |          |            |                |
|           |        regularStreamId         |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |        extendedStreamId        |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                         |          |            |                |
|           |       overnightStreamId        |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                         |          |            |                |
|           | overnightStreamMaxAgeInSeconds |         |              Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.              |  number  |                         |          |            |                |
|           |         sessionMarket          |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                         |          |            |                |
|           |       sessionMarketType        |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                         |          |            |                |
|           |       sessionBoundaries        |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                         |          |            |                |
|           |   sessionBoundariesTimeZone    |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                         |          |            |                |
|           |            smoother            |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman`, `none` | `kalman` |            |                |
|           |            decimals            |         |                                                                                   Decimals of output result                                                                                    |  number  |                         |   `8`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "xstocks",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
    "overnightStreamMaxAgeInSeconds": 100,
    "sessionMarket": "nyse",
    "sessionMarketType": "24/5",
    "sessionBoundaries": ["04:00", "16:00", "20:00"],
    "sessionBoundariesTimeZone": "America/New_York",
    "smoother": "kalman",
    "decimals": 8
  }
}
```

---

## Issuer-price-247 Endpoint

`issuer-price-247` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |                                                                                               Description                                                                                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |   targetEndpoint    |         |                                                                        The data-engine EA endpoint to request the 24/7 feed from                                                                        | string |  `v11`  |  `v11`  |            |                |
|    ✅     |       feedId        |         |                                                                     Data Streams feed ID of the 24/7 feed for the underlying asset                                                                      | string |         |         |            |                |
|    ✅     |     resultPath      |         |                                                                 The data-engine EA data field to use as the price, e.g. lastTradedPrice                                                                 | string |         |         |            |                |
|           |      decimals       |         | Decimals of output result, applied after the multiplier. With a multiplier the data-engine price is requested in the decimals of the on-chain multiplier, without one it is requested in these decimals | number |         |   `8`   |            |                |
|           |     multiplier      |         |                                                        On-chain multiplier applied to the price. When omitted, the raw stream price is returned                                                         | object |         |         |            |                |
|    ✅     |  multiplier.issuer  |         |                                                              The issuer of the tokenized asset. One of: robinhood, coinbase, xstocks, ondo                                                              | string |         |         |            |                |
|    ✅     |  multiplier.asset   |         |                                                                                  Token address of the tokenized asset                                                                                   | string |         |         |            |                |
|           | multiplier.registry |         |                                                                 Address of the issuer registry contract. Required for coinbase and ondo                                                                 | string |         |         |            |                |
|    ✅     | multiplier.network  |         |          Network to read the multiplier from: ethereum (ETHEREUM_RPC_URL), base (BASE_RPC_URL), robinhood-mainnet (ROBINHOOD_MAINNET_RPC_URL) or robinhood-testnet (ROBINHOOD_TESTNET_RPC_URL)          | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "issuer-price-247",
    "targetEndpoint": "v11",
    "feedId": "0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1",
    "resultPath": "lastTradedPrice",
    "decimals": 8,
    "multiplier": {
      "issuer": "robinhood",
      "asset": "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3",
      "network": "robinhood-mainnet"
    }
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "issuer-price-247",
    "targetEndpoint": "v11",
    "feedId": "0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1",
    "resultPath": "lastTradedPrice",
    "decimals": 8
  }
}
```

</details>

---

MIT License
