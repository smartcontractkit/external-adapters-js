# ONDO_CALCULATED

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/ondo-calculated/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name            |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |     ETHEREUM_RPC_URL      |                               RPC URL of a Mainnet ETH node                               | string |         |         |
|    ✅     |  DATA_ENGINE_ADAPTER_URL  |                                   URL of data engine ea                                   | string |         |         |
|    ✅     | TRADING_HOURS_ADAPTER_URL |                                  URL of tradinghours ea                                   | string |         |         |
|           |   ETHEREUM_RPC_CHAIN_ID   |                                The chain id to connect to                                 | number |         |   `1`   |
|           |   BACKGROUND_EXECUTE_MS   | The amount of time the background execute should sleep before performing the next request | number |         | `1000`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |                                                                                          Description                                                                                           |   Type   |     Options     | Default  | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-------------: | :------: | :--------: | :------------: |
|    ✅     |         registry          |         |                                                                                 Ondo on-chain registry address                                                                                 |  string  |                 |          |            |                |
|    ✅     |           asset           |         |                                                                         Maps to the asset in ondo’s on-chain registry                                                                          |  string  |                 |          |            |                |
|    ✅     |      regularStreamId      |         |                                                                   Data Streams regular hour feed ID for the underlying asset                                                                   |  string  |                 |          |            |                |
|    ✅     |     extendedStreamId      |         |                                                                  Data Streams extended hour feed ID for the underlying asset                                                                   |  string  |                 |          |            |                |
|    ✅     |     overnightStreamId     |         |                                                                  Data Streams overnight hour feed ID for the underlying asset                                                                  |  string  |                 |          |            |                |
|    ✅     |       sessionMarket       |         |                               The name of the market for session times, for example nyse. This is passed to the tradinghours adapter as the `market` parameter.                                |  string  |                 |          |            |                |
|    ✅     |     sessionMarketType     |         |                                The type of the market for session times, for example 24/5. This is passed to the tradinghours adapter as the `type` parameter.                                 |  string  |                 |          |            |                |
|    ✅     |     sessionBoundaries     |         | (backup) A list of time where market trasition from 1 session to the next in the format of HH:MM. This is only used when the adapter is unable to fetch session times from the tradinghours EA | string[] |                 |          |            |                |
|    ✅     | sessionBoundariesTimeZone |         |                                                                                 ANA Time Zone Database format                                                                                  |  string  |                 |          |            |                |
|           |         smoother          |         |                                                                           Smoothing algorithm to apply to the price                                                                            |  string  | `ema`, `kalman` | `kalman` |            |                |
|           |         decimals          |         |                                                                                   Decimals of output result                                                                                    |  number  |                 |   `8`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "registry": "0x0",
    "asset": "0x0",
    "regularStreamId": "0x0",
    "extendedStreamId": "0x0",
    "overnightStreamId": "0x0",
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

MIT License
