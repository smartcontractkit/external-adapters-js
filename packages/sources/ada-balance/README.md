# Chainlink External Adapter for Ada-balance

Version: 2.1.1

This adapter can be used to query Cardano address balances. The balance is queried from a Cardano node that has Ogmios running on top of it. Ogmios is a lightweight bridge interface that allows clients to query the Cardano node using JSON-RPC. More details can be found on their website https://ogmios.dev/.

## Environment Variables

| Required? |      Name       |                  Description                   |  Type  | Options | Default |
| :-------: | :-------------: | :--------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | WS_API_ENDPOINT |    The WS API endpoint of the Cardano node     | string |         |         |
|           |    RPC_PORT     | The port the Cardano Ogmios node is running on | number |         | `1337`  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases  |                 Description                 | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :-----------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to query balances for | array |         |         |            |                |

There are no examples for this endpoint.
