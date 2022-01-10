# Chainlink External Adapter for Alpine

Version: 1.1.1

This adapter gets the tvl of Ethereum vaults as well as the block numbers of the last cross chain transfers. The TVL endpoint gets the tvl of a vault on Ethereum. The LastBlock endpoint gets the lastblock of a cross chain transfer from the given chain.

## Environment Variables

| Required? |       Name       | Description |  Type  | Options | Default |
| :-------: | :--------------: | :---------: | :----: | :-----: | :-----: |
|           | ETHEREUM_RPC_URL |             | string |         |         |
|           | POLYGON_RPC_URL  |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [lastblock](#lastblock-endpoint), [tvl](#tvl-endpoint) |   ``    |

---

## Lastblock Endpoint

`lastblock` is the only supported name for this endpoint.

### Input Params

| Required? |      Name      | Aliases |             Description             |  Type  |        Options        |  Default   | Depends On | Not Valid With |
| :-------: | :------------: | :-----: | :---------------------------------: | :----: | :-------------------: | :--------: | :--------: | :------------: |
|    ✅     | stagingAddress |         | The address of the staging contract | string |                       |            |            |                |
|           |    network     |         |             The network             | string | `ETHEREUM`, `POLYGON` | `ETHEREUM` |            |                |

There are no examples for this endpoint.

---

## Tvl Endpoint

`tvl` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |            Description            |  Type  |        Options        |  Default   | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :-------------------------------: | :----: | :-------------------: | :--------: | :--------: | :------------: |
|    ✅     | vaultAddress |         | The address of the vault contract | string |                       |            |            |                |
|           |   network    |         |            The network            | string | `ETHEREUM`, `POLYGON` | `ETHEREUM` |            |                |

There are no examples for this endpoint.
