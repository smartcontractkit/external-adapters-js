# Chainlink External Adapter for blockstream

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|           | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |            Options             | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------: | :---------: |
|           | endpoint | The endpoint to use | difficulty, height             |             |

---

### Output Format

```json
[
    "0": {
        "id": "00000000000000000005a265bd231456ada98c8973304d2e85b45721925f468c",
        "height": 678207,
        "version": 536870912,
        "timestamp": 1617822205,
        "tx_count": 1264,
        "size": 1186287,
        "weight": 3999477,
        "merkle_root": "1c2a4d38613fe535851b0370a4179fee4cdb9ec8d37e215e5d6012550e4fe658",
        "previousblockhash": "0000000000000000000b564967e5ca4e06f04e5427098e20218e56d8ae6c77ec",
        "mediantime": 1617820737,
        "nonce": 1720091658,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "1": {
        "id": "0000000000000000000b564967e5ca4e06f04e5427098e20218e56d8ae6c77ec",
        "height": 678206,
        "version": 536870912,
        "timestamp": 1617822069,
        "tx_count": 2865,
        "size": 1367183,
        "weight": 3998024,
        "merkle_root": "2cd028ba7968443f7313c270a7a773f9494e29b3466ae278be866dd802d4e472",
        "previousblockhash": "000000000000000000037ec3a597c9d3874a22edb9e40b95d508208a8618dbdc",
        "mediantime": 1617820474,
        "nonce": 2194176382,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "2": {
        "id": "000000000000000000037ec3a597c9d3874a22edb9e40b95d508208a8618dbdc",
        "height": 678205,
        "version": 536895488,
        "timestamp": 1617822028,
        "tx_count": 2910,
        "size": 1391256,
        "weight": 3992799,
        "merkle_root": "fe0d57ea96c779cc2180b06d3494d0e8057d6fb3913eccc48757e6231dda903f",
        "previousblockhash": "000000000000000000029a66f693d298964b4538cb5f876fc2a304573b4739e0",
        "mediantime": 1617819941,
        "nonce": 277472510,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "3": {
        "id": "000000000000000000029a66f693d298964b4538cb5f876fc2a304573b4739e0",
        "height": 678204,
        "version": 939515904,
        "timestamp": 1617821472,
        "tx_count": 2672,
        "size": 1312653,
        "weight": 3998163,
        "merkle_root": "039b233f9230d611fd5b10f7276ca1b13d7ef821b9755d4761bbef0a03859a25",
        "previousblockhash": "000000000000000000072977e280cf711e9402f4afe241e333c362781643de4d",
        "mediantime": 1617815169,
        "nonce": 3687463126,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "4": {
        "id": "000000000000000000072977e280cf711e9402f4afe241e333c362781643de4d",
        "height": 678203,
        "version": 1073676288,
        "timestamp": 1617820830,
        "tx_count": 2885,
        "size": 1237510,
        "weight": 3999484,
        "merkle_root": "cbba55b49472d505d7545f9dff8a0a01e8d05eea57a28f4c906a5c4dba9fe027",
        "previousblockhash": "00000000000000000006d58a8a7549a32a31012f72754885b3e635c57f96c01b",
        "mediantime": 1617814855,
        "nonce": 972700980,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "5": {
        "id": "00000000000000000006d58a8a7549a32a31012f72754885b3e635c57f96c01b",
        "height": 678202,
        "version": 671080448,
        "timestamp": 1617820737,
        "tx_count": 2646,
        "size": 1280558,
        "weight": 3993329,
        "merkle_root": "c53d90cbd575d726594ffae95597bae426568fe83da646a999bafdc1c8e09bf6",
        "previousblockhash": "0000000000000000000476edefc840ded7911b0530ac986c50017d9c8b572888",
        "mediantime": 1617814834,
        "nonce": 963521289,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "6": {
        "id": "0000000000000000000476edefc840ded7911b0530ac986c50017d9c8b572888",
        "height": 678201,
        "version": 805298176,
        "timestamp": 1617820474,
        "tx_count": 1702,
        "size": 1523080,
        "weight": 3993610,
        "merkle_root": "d9db3dfddf9d293672ee35df756d620cf2d8c77aa74b63612fa6e82018b00d2b",
        "previousblockhash": "000000000000000000019130d7bd4355930ea99340fcab5b75680e2c70f1acf8",
        "mediantime": 1617814648,
        "nonce": 3523269897,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "7": {
        "id": "000000000000000000019130d7bd4355930ea99340fcab5b75680e2c70f1acf8",
        "height": 678200,
        "version": 541065216,
        "timestamp": 1617819941,
        "tx_count": 3334,
        "size": 1325501,
        "weight": 3993071,
        "merkle_root": "5c9a73fb33bf33aacf87020a49ffa878602cd8c7955fc7c9fff53c0fc84f297a",
        "previousblockhash": "00000000000000000000dd1daf50eb6ca2410030decb8318a807a899fae0a859",
        "mediantime": 1617814461,
        "nonce": 3891549902,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "8": {
        "id": "00000000000000000000dd1daf50eb6ca2410030decb8318a807a899fae0a859",
        "height": 678199,
        "version": 536870912,
        "timestamp": 1617815169,
        "tx_count": 1888,
        "size": 1338580,
        "weight": 3998290,
        "merkle_root": "cbe1526be8a3e96dbebaa28c8eed6dba4aa2c460fc5d726307878e1fb21c08e0",
        "previousblockhash": "0000000000000000000538ee317c6774c4555bc6c863d35318ece1452c125d20",
        "mediantime": 1617814261,
        "nonce": 25388561,
        "bits": 386673224,
        "difficulty": 23137439666472
    },
    "9": {
        "id": "0000000000000000000538ee317c6774c4555bc6c863d35318ece1452c125d20",
        "height": 678198,
        "version": 536928256,
        "timestamp": 1617814855,
        "tx_count": 673,
        "size": 1430583,
        "weight": 3999501,
        "merkle_root": "836e58e4e12448d48f91853a6e22d6f82a14143420c6e7521230a05c644b40f1",
        "previousblockhash": "00000000000000000003e9b131788ed1da867384e36df24f1f551931a6fe7d88",
        "mediantime": 1617814243,
        "nonce": 2279034319,
        "bits": 386673224,
        "difficulty": 23137439666472
        },
        "result": 23137439666472
    }
]
```
