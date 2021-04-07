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
{
    "jobRunID": "1",
    "data": {
        "0": {
            "id": "00000000000000000004f750822529412b53652759dfbc4adbe1fa247cf03fe0",
            "height": 678212,
            "version": 1073676288,
            "timestamp": 1617825114,
            "tx_count": 2569,
            "size": 1333284,
            "weight": 3993177,
            "merkle_root": "bb11ec6d7be9cdfd9cef4b6e9b2e6c0b6999b3d36e9603d9d37c0995390fd0f5",
            "previousblockhash": "0000000000000000000548216a24e05e8e4d9ba2a1d835f19bfd677d0205501d",
            "mediantime": 1617822205,
            "nonce": 4102352243,
            "bits": 386673224,
            "difficulty": 23137439666472
        },
        "1": {
            "id": "0000000000000000000548216a24e05e8e4d9ba2a1d835f19bfd677d0205501d",
            "height": 678211,
            "version": 1073676288,
            "timestamp": 1617824291,
            "tx_count": 1390,
            "size": 1209760,
            "weight": 3999511,
            "merkle_root": "286bb6615833e7dbc9075d5b6517774330a0b16ec477bc994017d68006bbf5e4",
            "previousblockhash": "000000000000000000031895a170e3766df4b5220308049159649ac72b06ca36",
            "mediantime": 1617822069,
            "nonce": 3988554539,
            "bits": 386673224,
            "difficulty": 23137439666472
        },
        "2": {
            "id": "000000000000000000031895a170e3766df4b5220308049159649ac72b06ca36",
            "height": 678210,
            "version": 939515904,
            "timestamp": 1617824196,
            "tx_count": 1959,
            "size": 1342796,
            "weight": 3993092,
            "merkle_root": "cdec8b67186fe78d238cd2492cfbc37841e8e39a16747feb5a5698d537b8cecb",
            "previousblockhash": "0000000000000000000be33f70945781655be146997e01b674998bc0c80b9174",
            "mediantime": 1617822028,
            "nonce": 1536337487,
            "bits": 386673224,
            "difficulty": 23137439666472
        },
        "3": {
            "id": "0000000000000000000be33f70945781655be146997e01b674998bc0c80b9174",
            "height": 678209,
            "version": 545259520,
            "timestamp": 1617823832,
            "tx_count": 2565,
            "size": 1352471,
            "weight": 3992882,
            "merkle_root": "506ea8b0c9d6aac7eb3b7c69365784f10f8ce52b82313a4b44a2467015faa6d0",
            "previousblockhash": "00000000000000000005cf95ef36b4c11bb05c1551fffd6abc71491053cb999a",
            "mediantime": 1617821472,
            "nonce": 2061378597,
            "bits": 386673224,
            "difficulty": 23137439666472
        },
        "4": {
            "id": "00000000000000000005cf95ef36b4c11bb05c1551fffd6abc71491053cb999a",
            "height": 678208,
            "version": 549453824,
            "timestamp": 1617822980,
            "tx_count": 2517,
            "size": 1326302,
            "weight": 3999539,
            "merkle_root": "b13b21853b005e6c2caf09281d4d3c8402d1377e72aed3338e0aed152fa4d294",
            "previousblockhash": "00000000000000000005a265bd231456ada98c8973304d2e85b45721925f468c",
            "mediantime": 1617820830,
            "nonce": 1888805771,
            "bits": 386673224,
            "difficulty": 23137439666472
        },
        "5": {
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
        "6": {
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
        "7": {
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
        "8": {
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
        "9": {
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
        "result": 23137439666472
    },
    "result": 23137439666472,
    "statusCode": 200
}
```
