# VIEW_STARKNET_LATEST_ANSWER

![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   STARKNET_RPC_URL    |      RPC url for the STARKNET NETWORK. NETWORK is the value of `network` input param      | string |         |         |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [function](#function-endpoint) | `function` |

## Function Endpoint

`function` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |  Aliases   |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | address | `contract` | Address of the contract | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "function",
    "address": "0x013584125fb2245fab8179e767f2c393f74f7370ddc2748aaa422f846cc760e4"
  }
}
```

---

MIT License
