# Chainlink External Adapter for Unibit

### Environment Variables

| Required? |     Name     |          Description           | Options |          Defaults to           |
| :-------: | :----------: | :----------------------------: | :-----: | :----------------------------: |
|    ✅     |   API_KEY    |      API key for Unibit      |         |                                |
|           | API_ENDPOINT | The endpoint for your Unibit |         | `https://api-v2.intrinio.com/` |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [historical](#Historical-Endpoint) |   `historical`   |

---

## Historical Endpoint

This historical endpoint provides the closing price of the previous day as detailed in [Unibit documentation](https://unibit.ai/api/docs/V2.0/historical_stock_price).

### Input Params

| Required? |               Name               |             Description             | Options | Defaults to |
| :-------: | :------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, `market` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "VXX"
  }
}
```

### Sample Output

```json

```
