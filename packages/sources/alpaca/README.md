# ALPACA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alpaca/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |                                                                                           Description                                                                                           |  Type  | Options |                           Default                            |
| :-------: | :---------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------------------------------: |
|    ✅     |    `CLIENT_ID`    |                                                              Broker API client id for the OAuth client-credentials token exchange.                                                              | string |         |                                                              |
|    ✅     |  `CLIENT_SECRET`  |                                                            Broker API client secret for the OAuth client-credentials token exchange.                                                            | string |         |                                                              |
|           |  `AUTH_ENDPOINT`  |                                   Full OAuth token endpoint URL. Moves with the environment: sandbox host now, production host (authx.alpaca.markets) later.                                    | string |         |    `https://authx.sandbox.alpaca.markets/v1/oauth2/token`    |
|           | `WS_API_ENDPOINT` | Full WebSocket URL. The production host (stream.data.alpaca.markets) replaces the sandbox host once the boat-entitled environment is provisioned; the path (/v1beta1/overnight) stays the same. | string |         | `wss://stream.data.sandbox.alpaca.markets/v1beta1/overnight` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                Options                 |    Default     |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------: | :------------: |
|           | endpoint | The endpoint to use | string | [stock_quotes](#stock_quotes-endpoint) | `stock_quotes` |

## Stock_quotes Endpoint

`stock_quotes` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |         Aliases          |                           Description                           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :-------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | Bare US ticker, e.g. AAPL. Class shares use dot suffix (BRK.B). | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |               Quote currency, USD for this feed.                | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock_quotes",
    "base": "AAPL",
    "quote": "USD"
  }
}
```

---

MIT License
