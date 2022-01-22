# Chainlink External Adapter for Wrapped

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | [deposits](#Deposits-Endpoint) |  deposits   |

---

## Deposits Endpoint

### Input Params

| Required? |   Name    |             Description              |         Options          | Defaults to |
| :-------: | :-------: | :----------------------------------: | :----------------------: | :---------: |
|    ✅     | `symbol`  | The symbol of the currency to query  | `BTC`, `ETH`, `LTC`, etc |             |
|           | `network` | The network of the currency to query |                          |             |
|           | `chainId` | The chainId of the currency to query |                          |   `main`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH",
    "chainId": "mainnet",
    "network": "Ethereum"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": [
    {
      "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4",
      "network": "Ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2",
      "network": "Ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677",
      "network": "Ethereum",
      "chainId": "mainnet"
    }
  ],
  "statusCode": 200,
  "data": {
    "result": [
      {
        "address": "0x6E4C739B4d66E7104739Fc0F235E9c9FFD1F8da4",
        "network": "Ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x67a53ADbA557E6129D3Eb1aab090E23D22711DB2",
        "network": "Ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x57Fc3f242aD907E9518645Ba4D0802F7a65B3677",
        "network": "Ethereum",
        "chainId": "mainnet"
      }
    ]
  }
}
```
