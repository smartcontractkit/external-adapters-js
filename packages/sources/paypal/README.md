# Chainlink External Adapter for Paypal

A template to be used as an example for new [External Adapters](https://github.com/smartcontractkit/external-adapters-js)

(please fill out with corresponding information)

An example adapter description

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | API_KEY | An API key that can be obtained from the data provider's dashboard (add a ✅ in `Required?` if this parameter is required) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options           | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------: | :---------: |
|           | endpoint | The endpoint to use | [example](#Paypal-Endpoint) |   example   |

---

## Paypal Endpoint

An example endpoint description

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```

## Disclaimer

In order to use this adapter, you will need to create an account with and obtain credentials from PayPal and agree to and comply with PayPal’s applicable terms, conditions and policies. In no event will SmartContract Chainlink Limited SEZC be liable for your or your user’s failure to comply with any or all of PayPal’s terms, conditions or policies or any other applicable license terms.
