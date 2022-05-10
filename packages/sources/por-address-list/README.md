# PoR Address List Adapter

![0.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/por-address-list/package.json)

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                     Description                                      |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL | The RPC URL to connect to the EVM chain the address manager contract is deployed to. | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

`address` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                         Description                          | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :----------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           |  confirmations  |         |        The number of confirmations to query data from        |      |         |         |            |                |
|    ✅     | contractAddress |         |     The contract address holding the custodial addresses     |      |         |         |            |                |
|           |    batchSize    |         | The number of addresses to fetch from the contract at a time |      |         |  `10`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "contractAddress": "0xA72206A7877B27831b520FE0405746f9Ef9a0B98",
    "batchSize": 10,
    "confirmations": 0
  }
}
```

Response:

---

MIT License
