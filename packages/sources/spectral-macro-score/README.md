# Chainlink External Adapter for Spectral-MACRO-Score

Used to retrieve a MACRO Score for a given token ID.

### Environment Variables

| Required? |     Name     |                            Description                             | Options |                          Defaults to                           |
| :-------: | :----------: | :----------------------------------------------------------------: | :-----: | :------------------------------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from the data provider's dashboard |         |                                                                |
|    ✅     |   RPC_URL    |                          Ethereum RPC URL                          |         |                                                                |
|    ✅     | NFC_ADDRESS  |                    Address of the NFC contract                     |         |                                                                |
|           | API_ENDPOINT |                      MACRO Score API Endpoint                      |         | https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default |

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
  "data": {
    "result": 1 // this will be the resulting MACRO Score tick
  },
  "statusCode": 200
}
```
