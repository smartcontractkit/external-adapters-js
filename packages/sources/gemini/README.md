# Chainlink External Adapter for Gemini

Version: 2.1.1

An external adapter to get data from Gemini

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default          |
| :-------: | :----------: | :---------: | :----: | :-----: | :----------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.gemini.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

---

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases     |                       Description                        |  Type  | Options |  Default   | Depends On | Not Valid With |
| :-------: | :-----: | :-------------: | :------------------------------------------------------: | :----: | :-----: | :--------: | :--------: | :------------: |
|    ✅     |  token  | `asset`, `coin` |             The symbol of the token to query             | string |         |   `EFIL`   |            |                |
|           | chainId |                 | An identifier for which network of the blockchain to use | string |         | `mainnet`  |            |                |
|           | network |                 |                                                          | string |         | `filecoin` |            |                |

There are no examples for this endpoint.
