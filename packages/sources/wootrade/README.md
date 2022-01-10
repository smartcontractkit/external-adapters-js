# Chainlink External Adapter for Wootrade

Version: 1.1.1

Adapter using the public Wootrade market API for both HTTP(s) and WS.

## Environment Variables

| Required? |  Name   |            Description            | Type | Options | Default |
| :-------: | :-----: | :-------------------------------: | :--: | :-----: | :-----: |
|           | API_KEY | An key to use the wootrade WS API |      |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `ticker`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `coin` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `to`, `market` | The symbol of the currency to convert to | string |         |         |            |                |

There are no examples for this endpoint.
