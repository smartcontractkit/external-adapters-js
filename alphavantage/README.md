# Chainlink External Adapter for AlphaVantage

Use this adapter for connecting to [AlphaVantage's API](https://www.alphavantage.co/documentation/) from a Chainlink node.

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

Returns the exchange rate from a currency's current price to a given currency

### Input Params

| Required? |            Name            |               Description                |                                                                          Options                                                                           | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/) |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | [Physical Currency list](https://www.alphavantage.co/physical_currency_list/) or [Cryptocurrency list](https://www.alphavantage.co/digital_currency_list/) |             |
