# Chainlink External Adapter for Spectral-MACRO-Score

Used to retrieve a MACRO Score for a given token ID.

### Environment Variables

| Required? |    Name     |                            Description                             | Options | Defaults to |
| :-------: | :---------: | :----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   API_KEY   | An API key that can be obtained from the data provider's dashboard |         |             |
|    ✅     |   RPC_URL   |                          Ethereum RPC URL                          |         |             |
|    ✅     | NFC_ADDRESS |                    Address of the NFC contract                     |         |             |

---

## Spectral-MACRO-Score Endpoint

Default endpoint used to retrieve a MACRO Score for a given token ID.

### Input Params

| Required? |     Name     |                             Description                              | Options | Defaults to |
| :-------: | :----------: | :------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `tokenIdInt` |             The tokenID for the user as an integer value             |         |             |
|    ✅     |  `tickSet`   | The set of ticks used to compute the MACRO Score as in integer value |         |             |

### Sample Input

```json
{
  "id": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "tokenIdInt": "106006608980615540182575301024074047146897433631717113916135614816662076801843",
    "tickeSet": "1"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": [
    {
      "address": "0xa55E01a40557fAB9d87F993d8f5344f1b2408072",
      "score_aave": "604.77",
      "score_comp": "300.00",
      "score": "452.38",
      "updated_at": "2021-07-18T20:53:54.402553Z",
      "is_updating_aave": false,
      "is_updating_comp": false,
      "result": 452.38
    }
  ],
  "statusCode": 200
}
```
