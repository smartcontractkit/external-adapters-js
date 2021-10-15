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

### Chainlink Node Job example

```json
type = "directrequest"
schemaVersion = 1
name = "Source Tick Into NFC"
contractAddress = "ADDRESS"
maxTaskDuration = "0s"
observationSource = """
    decode_log   [type=ethabidecodelog
                  abi="OracleRequest(bytes32 indexed specId, address requester, bytes32 requestId, uint256 payment, address callbackAddr, bytes4 callbackFunctionId, uint256 cancelExpiration, uint256 dataVersion, bytes data)"
                  data="$(jobRun.logData)"
                  topics="$(jobRun.logTopics)"]
    decode_cbor [type=cborparse data="$(decode_log.data)"]
    macro_score_adapter        [type=bridge name="spectral-macro-score-adapter" requestData="{\\"data\\":{\\"tokenIdHash\\": $(decode_cbor.tokenIdHash), \\"tickSetId\\": $(decode_cbor.tickSetId)}}"]
    parse        [type=jsonparse path="result"]
    encode_data  [type=ethabiencode abi="(uint256 tickResponse)" data="{\\"tickResponse\\":$(parse)}"]
    encode_tx    [type=ethabiencode
                  abi="fulfillOracleRequest(bytes32 requestId, uint256 payment, address callbackAddress, bytes4 callbackFunctionId, uint256 expiration, bytes32 data)"
                  data="{\\"requestId\\": $(decode_log.requestId),\\"payment\\": $(decode_log.payment),\\"callbackAddress\\": $(decode_log.callbackAddr),\\"callbackFunctionId\\": $(decode_log.callbackFunctionId),\\"expiration\\": $(decode_log.cancelExpiration),\\"data\\": $(encode_data)}"]
    submit_tx    [type=ethtx to="ADDRESS" data="$(encode_tx)"]

    decode_log -> decode_cbor -> macro_score_adapter -> parse -> encode_data -> encode_tx -> submit_tx
"""
```
