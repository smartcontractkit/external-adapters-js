# Chainlink External Adapter for Spectral-MACRO-Score

Used to retrieve a MACRO Score for a given token ID.

### Environment Variables

| Required? |         Name         |                            Description                             | Options |                  Defaults to                   |
| :-------: | :------------------: | :----------------------------------------------------------------: | :-----: | :--------------------------------------------: |
|    ✅     |       API_KEY        | An API key that can be obtained from the data provider's dashboard |         |                                                |
|    ✅     |       RPC_URL        |                          Ethereum RPC URL                          |         |                                                |
|    ✅     | NFC_REGISTRY_ADDRESS |                Address of the NFC registry contract                |         |                                                |
|           |     API_ENDPOINT     |                      MACRO Score API Endpoint                      |         | https://macro-api-staging.spectral.finance/api |

---

## Spectral-MACRO-Score Endpoint

Default endpoint used to retrieve a MACRO Score for a given token ID.

### Input Params

| Required? |     Name      |                                  Description                                   | Options | Defaults to |
| :-------: | :-----------: | :----------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `tokenIdHash` |                The tokenID for the user as a bytes32 hash value                |         |             |
|    ✅     |  `tickSetId`  | The id of the set of ticks used to compute the MACRO Score as in integer value |         |             |

### Sample Input

```json
{
  "jobRunID": "1",
  "data": {
    "tokenIdHash": "0x1a8b05acc3013b2d34a747a85d7d878597bdb177c31c6d0a06b9e654817a9582",
    "tickSetId": "1"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1 // this will be the resulting MACRO Score tick
  },
  "statusCode": 200
}
```
