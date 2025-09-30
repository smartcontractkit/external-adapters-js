# LLAMA_GUARD

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/llama-guard/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   ETHEREUM_RPC_URL    |                               RPC URL of a Mainnet ETH node                               | string |         |         |
|           | ETHEREUM_RPC_CHAIN_ID |                                The chain id to connect to                                 | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |                                    Description                                     |  Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :--------------------------------------------------------------------------------: | :-----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    source    |         | Name of the Adapters that provides Nav data, requires ${source}\_EA_URL in env var | string  |         |         |            |                |
|    ✅     | sourceInput  |         |                      JSON input to Adapters in string format                       | string  |         |         |            |                |
|           | sourceScaled |         |              Adapter return nav data scaled to output decimals or not              | boolean |         |         |            |                |
|    ✅     |    asset     |         |                 Address of asset in LlamaGuard's ParameterRegistry                 | string  |         |         |            |                |
|    ✅     |   registry   |         |                 Contract address of LlamaGuard's ParameterRegistry                 | string  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "source": "name",
    "sourceInput": "{'param': '1'}",
    "sourceScaled": false,
    "asset": "0x0",
    "registry": "0x1"
  }
}
```

---

MIT License
