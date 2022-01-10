# Chainlink External Adapter for Curve.fi

Version: 1.1.1

This adapter allows querying Curve.fi contracts

## Environment Variables

| Required? |         Name         | Description |  Type  | Options |                   Default                    |
| :-------: | :------------------: | :---------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |       RPC_URL        |             | string |         |                                              |
|           |   ADDRESS_PROVIDER   |             | string |         | `0x0000000022D53366457F9d5E68Ec105046FC4383` |
|           | EXCHANGE_PROVIDER_ID |             | number |         |                     `2`                      |
|           |  BLOCKCHAIN_NETWORK  |             | string |         |                  `ethereum`                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |      Aliases      |                                                     Description                                                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :---------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     from     |  `base`, `coin`   |                                         The symbol of the currency to query                                          | string |         |         |            |                |
|           | fromAddress  |                   |          Optional param to pre-define the address to convert from. If set, it takes precedence over `from`           | string |         |         |            |                |
|           | fromDecimals |                   | Optional param to pre-define the number of decimals in the `from` token. Setting this will make the query run faster | number |         |         |            |                |
|    ✅     |      to      | `quote`, `market` |                                       The symbol of the currency to convert to                                       | string |         |         |            |                |
|           |  toAddress   |                   |            Optional param to pre-define the address to convert to. If set, it takes precedence over `to`             | string |         |         |            |                |
|           |  toDecimals  |                   |  Optional param to pre-define the number of decimals in the `to` token. Setting this will make the query run faster  | number |         |         |            |                |
|           |    amount    |                   |               The exchange amount to get the rate of. The amount is in full units, e.g. 1 USDC, 1 ETH                | number |         |   `1`   |            |                |
|           |  resultPath  |                   |                                               The path for the result                                                | string |         |         |            |                |

There are no examples for this endpoint.
