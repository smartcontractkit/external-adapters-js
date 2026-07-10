# SIX

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/six/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Newlines in `PRIVATE_KEY` and `PUBLIC_CERT`

These values are multi-line PEM strings. How you pass them depends on the method:

### `--env-file`

Either escape newlines with `\n`:

```
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
PUBLIC_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

Or use literal newlines:

```
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"
PUBLIC_CERT="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
```

### Command line

Use ANSI-C quoting (`$'...'`) to interpret `\n`:

```bash
PRIVATE_KEY=$'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
PUBLIC_CERT=$'-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
```

Or use single quotes with literal newlines:

```bash
PRIVATE_KEY='-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----'
PUBLIC_CERT='-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----'
```

## Environment Variables

| Required? |      Name       |                                                  Description                                                   |  Type  | Options |                  Default                   |
| :-------: | :-------------: | :------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------------: |
|           | WS_API_ENDPOINT |                                           SIX WebSocket API endpoint                                           | string |         | `wss://api.six-group.com/web/v2/websocket` |
|           |  API_ENDPOINT   |                                             SIX REST API base URL                                              | string |         |        `https://api.six-group.com`         |
|    ✅     |   PRIVATE_KEY   |    The private key that starts with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----"     | string |         |                                            |
|    ✅     |   PUBLIC_CERT   | The public certificate that starts with "-----BEGIN CERTIFICATE-----" and end with "-----END CERTIFICATE-----" | string |         |                                            |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                               Options                                               | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [market-status](#market-status-endpoint), [stock](#stock-endpoint), [stock_quotes](#stock-endpoint) | `stock` |

## Market-status Endpoint

`market-status` is the only supported name for this endpoint.

### Input Params

| Required? |         Name         | Aliases |                                     Description                                     |  Type   |      Options      |  Default  | Depends On | Not Valid With |
| :-------: | :------------------: | :-----: | :---------------------------------------------------------------------------------: | :-----: | :---------------: | :-------: | :--------: | :------------: |
|    ✅     |        market        |         |                               The name of the market                                | string  |                   |           |            |                |
|           |         type         |         |                              Type of the market status                              | string  | `24/5`, `regular` | `regular` |            |                |
|           |       weekend        |         | DHH-DHH:TZ, 520-020:America/New_York means Fri 20:00 to Sun 20:00 Eastern Time Zone | string  |                   |           |            |                |
|           | force245MarketStatus |         |                        Return response in 24/5 market status                        | boolean |                   |           |            |                |

### Example

There are no examples for this endpoint.

---

## Stock Endpoint

Supported names for this endpoint are: `stock`, `stock_quotes`.

### Input Params

| Required? | Name |                   Aliases                   |         Description          |  Type  |         Options         | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :--------------------------: | :----: | :---------------------: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` |  The stock ticker to query   | string |                         |         |            |                |
|           | type |                                             | The type of request to serve | string | `stock`, `stock_quotes` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock",
    "base": "ABBN_4"
  }
}
```

---

MIT License
