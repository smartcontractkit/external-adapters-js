# Chainlink External Adapter for Spectral-MACRO-Score

Used to retrieve a tick (bucket in Credit Scores) for a given token ID hash.

### Environment Variables

| Required? |         Name         |             Description              | Options | Defaults to |
| :-------: | :------------------: | :----------------------------------: | :-----: | :---------: |
|    ✅     |  BASE_URL_MACRO_API  |       MACRO Score API base URL       |         |             |
|    ✅     |  BASE_URL_FAST_API   |      Bundles' Fast API Base URL      |         |             |
|    ✅     |    MACRO_API_KEY     |         MACRO Score API Key          |         |             |
|    ✅     |     FAST_API_KEY     |             FAST API Key             |         |             |
|    ✅     |      INFURA_URL      |     Base URL of Infura ENDPOINT      |         |             |
|    ✅     |    INFURA_API_KEY    |            INFURA API KEY            |         |             |
|    ✅     | NFC_REGISTRY_ADDRESS | Address of the NFC registry contract |         |             |

---

## Spectral-MACRO-Score Endpoint

Default endpoint used to retrieve a tick (bucket in Credit Scores) for a given token ID hash.

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
