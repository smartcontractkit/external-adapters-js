# Chainlink External Adapter for Enzyme

Version: 1.1.1

Adapter to interact with Enzyme contracts.

## Environment Variables

| Required? |       Name       |                                Description                                 |  Type  | Options | Default |
| :-------: | :--------------: | :------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | An http(s) RPC URL to a blockchain node that can read the Enzyme contracts | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                             Options                                                              |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [calcgav](#calcgav-endpoint), [calcnav](#calcnav-endpoint), [calcnetvalueforsharesholder](#calcnetvalueforsharesholder-endpoint) | `calcNav` |

---

## CalcGav Endpoint

`calcGav` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |

There are no examples for this endpoint.

---

## CalcNav Endpoint

`calcNav` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |

There are no examples for this endpoint.

---

## CalcNetValueForSharesHolder Endpoint

`calcNetValueForSharesHolder` is the only supported name for this endpoint.

### Input Params

| Required? |        Name        | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract |         |             | string |         |         |            |                |
|    ✅     |     vaultProxy     |         |             | string |         |         |            |                |
|    ✅     |    sharesHolder    |         |             | string |         |         |            |                |

There are no examples for this endpoint.
