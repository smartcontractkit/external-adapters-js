# Chainlink External Adapter for Connexun

Retrieve sentiment analysis for specific cryptocurrencies.

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|   ✅        | API_KEY | An API key that can be obtained from the data provider's dashboard  |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|    ✅     | endpoint | The endpoint to use | [crypto-sentiment](#Connexun-Crypto-Sentiment) |   n/a   |

---

## Connexun Crypto Sentiment

An example endpoint description

### Input Params

Connexun returns a sentiment value between -1 and 1 with 4 digits of precision as a string (e.g. "0.2334") that is then
converted into a number, multiplied by ten to the power of four (10^4), and finally returned for the next task.

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|        | `token`  |   The symbol of the currency to query    | 'ADA', 'BCH', 'BNB', 'BTC', 'DOGE', 'DOT', 'EOS', 'ETC', 'ETH', 'FIL', 'ICP', 'LTC', 'MATIC', 'SOL', 'THETA', 'TRX', 'VET', 'XLM', 'XMR', 'XRP' |      n/a*       |
|         | `period` | The number of hours since now to get sentiment for | 1, 6, 12, 24 |     12        |

*When no specific token is passed, the overall market sentiment is returned.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto-sentiment",
    "token": "ETH",
    "period": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": 4741
  },
  "result": 4741
  "statusCode": 200
}
```