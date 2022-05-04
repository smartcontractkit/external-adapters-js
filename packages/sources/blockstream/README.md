# Chainlink External Adapter for Blockstream

![1.2.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/blockstream/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |            Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT |             | string |         | `https://blockstream.info/api` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                          Options                           |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#blocks-endpoint), [height](#blocks-endpoint) | `difficulty` |

## Blocks Endpoint

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "height",
    "resultPath": "difficulty"
  },
  "debug": {
    "cacheKey": "8/YPGiX6OgJUyUzn7Q5lMP6/5gc="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "id": "000000000000000000060c1f01e709357e0aca37d4a6940ce9cf67dfa6c6ff4f",
        "height": 712285,
        "version": 536870916,
        "timestamp": 1638477146,
        "tx_count": 1588,
        "size": 1664541,
        "weight": 3993558,
        "merkle_root": "3b8b49a37c1bf37ac11c4791627173db25645e15eaf8a22daf9878c64c24878a",
        "previousblockhash": "000000000000000000053674a0ac627c0a3480d7e332e813080d2784f2421962",
        "mediantime": 1638474964,
        "nonce": 3987236162,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "000000000000000000053674a0ac627c0a3480d7e332e813080d2784f2421962",
        "height": 712284,
        "version": 536870916,
        "timestamp": 1638477054,
        "tx_count": 3240,
        "size": 1614463,
        "weight": 3998296,
        "merkle_root": "f0384a0d9bab8b0410a591da1c2ad691b4b9f961cdcf5c99a38690ea41bd57b9",
        "previousblockhash": "00000000000000000008daaf5a7d080c2bd58dd81c05c9b0e8f3d75fd01f99c7",
        "mediantime": 1638473034,
        "nonce": 2891485728,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "00000000000000000008daaf5a7d080c2bd58dd81c05c9b0e8f3d75fd01f99c7",
        "height": 712283,
        "version": 536928256,
        "timestamp": 1638476745,
        "tx_count": 2625,
        "size": 1539900,
        "weight": 3993222,
        "merkle_root": "c8b4735a24d5bda287276ff3792378dbfb7a88da175a1cf1ca799d1c50d78c5b",
        "previousblockhash": "0000000000000000000289ec74159b92f031501c828adffa15482c81bdb917f7",
        "mediantime": 1638473031,
        "nonce": 1834340801,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "0000000000000000000289ec74159b92f031501c828adffa15482c81bdb917f7",
        "height": 712282,
        "version": 761520128,
        "timestamp": 1638476380,
        "tx_count": 3287,
        "size": 1463370,
        "weight": 3993039,
        "merkle_root": "d69cb6a4f03011bc5fe292f7b3d66e9968c8791667c7b21622166df8ccb27584",
        "previousblockhash": "00000000000000000001e4e3b1a508d1910e75737c433cca2d9fc9ca001196ff",
        "mediantime": 1638472657,
        "nonce": 637122665,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "00000000000000000001e4e3b1a508d1910e75737c433cca2d9fc9ca001196ff",
        "height": 712281,
        "version": 549453828,
        "timestamp": 1638474987,
        "tx_count": 2450,
        "size": 1547500,
        "weight": 3993295,
        "merkle_root": "112cad4ed5aa78ed53edd4b644c97baabf20463d5a52ff95b2634c2c11f5805e",
        "previousblockhash": "00000000000000000001a4d48f5843ad36df5d2e451fa08c1cb65dcec52c6f51",
        "mediantime": 1638472451,
        "nonce": 3860257557,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "00000000000000000001a4d48f5843ad36df5d2e451fa08c1cb65dcec52c6f51",
        "height": 712280,
        "version": 939515904,
        "timestamp": 1638474964,
        "tx_count": 3401,
        "size": 1407816,
        "weight": 3993330,
        "merkle_root": "a1f650e7929166ee1b1dd3cfe29843bb674bb795b2dc82b26e5430258b39e140",
        "previousblockhash": "000000000000000000055e7c761f70b5fc1e7ba2b0647a40bc068d904abd5fef",
        "mediantime": 1638472362,
        "nonce": 108393565,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "000000000000000000055e7c761f70b5fc1e7ba2b0647a40bc068d904abd5fef",
        "height": 712279,
        "version": 547356672,
        "timestamp": 1638473034,
        "tx_count": 97,
        "size": 1828085,
        "weight": 3992924,
        "merkle_root": "41ae696b33e3354fa1df364d0139f5c4590d2daaa1ddbc5e1f4b1e04e6937d8d",
        "previousblockhash": "000000000000000000047a16c83a4dd0bbcad9e0ceff1f2ddfba4df3b46f8201",
        "mediantime": 1638472187,
        "nonce": 2988779842,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "000000000000000000047a16c83a4dd0bbcad9e0ceff1f2ddfba4df3b46f8201",
        "height": 712278,
        "version": 674168836,
        "timestamp": 1638473031,
        "tx_count": 1736,
        "size": 1645944,
        "weight": 3993417,
        "merkle_root": "49be13c94d5c6318df36da8bb174671bc88daaaac7c600310a65d7dc7e5cfadb",
        "previousblockhash": "000000000000000000054df5b47f09c02a2ac2397ecfd20c54ef2ebe5351c354",
        "mediantime": 1638472041,
        "nonce": 3388402015,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "000000000000000000054df5b47f09c02a2ac2397ecfd20c54ef2ebe5351c354",
        "height": 712277,
        "version": 549453828,
        "timestamp": 1638472657,
        "tx_count": 996,
        "size": 1750119,
        "weight": 3993084,
        "merkle_root": "69b42968b55e4cacf09b3ac48e0c4ac068a888dab97076ac71b6e0d1a301abba",
        "previousblockhash": "00000000000000000002739d3caac26a350da8546e2b5ded08d9922efc065be1",
        "mediantime": 1638471573,
        "nonce": 2840158099,
        "bits": 386701843,
        "difficulty": 22335659268936
      },
      {
        "id": "00000000000000000002739d3caac26a350da8546e2b5ded08d9922efc065be1",
        "height": 712276,
        "version": 541065220,
        "timestamp": 1638472451,
        "tx_count": 428,
        "size": 1774434,
        "weight": 3993405,
        "merkle_root": "58ca8779191d2b86116e34ebd160d1fe290af40a2048e3b1fb09d201a9f95805",
        "previousblockhash": "00000000000000000007dfcd40f1efea4e0a81894189c90d78364b271f075332",
        "mediantime": 1638471549,
        "nonce": 285351719,
        "bits": 386701843,
        "difficulty": 22335659268936
      }
    ],
    "result": 22335659268936
  },
  "result": 22335659268936,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
