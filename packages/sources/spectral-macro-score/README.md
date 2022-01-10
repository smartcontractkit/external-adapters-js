# Chainlink External Adapter for Spectral-MACRO-Score

Version: 1.1.1

Used to retrieve a MACRO Score for a given token ID.

## Environment Variables

| Required? |       Name       |                            Description                             |  Type  | Options |                             Default                              |
| :-------: | :--------------: | :----------------------------------------------------------------: | :----: | :-----: | :--------------------------------------------------------------: |
|    ✅     |     API_KEY      | An API key that can be obtained from the data provider's dashboard | string |         |                                                                  |
|    ✅     | ETHEREUM_RPC_URL |                          Ethereum RPC URL                          | string |         |                                                                  |
|    ✅     |   NFC_ADDRESS    |                    Address of the NFC contract                     | string |         |                                                                  |
|           |   API_ENDPOINT   |                      MACRO Score API Endpoint                      | string |         | `https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                 Options                  |     Default      |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------: | :--------------: |
|           | endpoint | The endpoint to use | string | [macroscoreapi](#macroscoreapi-endpoint) | `spectral-proxy` |

---

## MacroScoreAPI Endpoint

`spectral-proxy` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                             Description                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | tokenIdInt |         |             The tokenID for the user as an integer value             | string |         |         |            |                |
|    ✅     | tickSetId  |         | The set of ticks used to compute the MACRO Score as in integer value | string |         |         |            |                |

There are no examples for this endpoint.
