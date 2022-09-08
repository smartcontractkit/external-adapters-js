# Chainlink External Adapter for CCIP Read

The CCIP Read adapter acts as the gateway server for the CCIP Read protocol as outlined here https://github.com/Arachnid/EIPs/blob/ccip-read/EIPS/eip-3668.md. It's job is to take in data from a client, fetch proofs from outside the L1 chain and return it to the client.

### Environment Variables

| Required? |           Name           |                                                    Description                                                     | Options | Defaults to |
| :-------: | :----------------------: | :----------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |         RPC_URL          |                                       The RPC URL to connect to the L1 chain                                       |         |             |
|           |         CHAIN_ID         |                                             The chain id to connect to                                             |         |      1      |
|           |        L2_RPC_URL        |          The L2 RPC URL to connect to the L2 chain. Required if using the optimism-metis global endpoint.          |         |             |
|           |       L2_CHAIN_ID        |                                             The chain id to connect to                                             |         |      1      |
|           | ADDRESS_MANAGER_CONTRACT | The address of the AddresssManager contract in the L1 chain. Required if using the optimism-metis global endpoint. |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                          Options                           |      Defaults to       |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------: | :--------------------: |
|           | endpoint | The endpoint to use | [optimism-metis-gateway](#Optimism Metis Gateway Endpoint) | optimism-metis-gateway |

---

## Optimism Metis Gateway Endpoint

The endpoint reads the latest proof from Optimism/Metis as the L2 chain and returns the proof to the caller.
Currently this endpoint has the same functionality as the server in this example https://github.com/smartcontractkit/ccip-read/tree/6d4deb917781f3becda39b9ebad6f21e037af1a6/examples/optimism-gateway.

### L2 Chains supported

- Optimism
- Metis

### Input Params

| Required? |  Name  |                                              Description                                               | Options | Defaults to |
| :-------: | :----: | :----------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `abi`  | The ABI of the originally called L1 contract. In this example it is the OptimismResolverStub contract. |         |             |
|    ✅     |  `to`  |                         The **L1** address of the original called L1 contract.                         |         |
|    ✅     | `data` |            The hex encoded function call of the original function called in the L1 contract            |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "to": "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
    "data": "0x3b3b57de28f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb",
    "abi": [
      {
        "inputs": [
          {
            "internalType": "contract OptimismVerifierI",
            "name": "_verifier",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "_gateway",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "_l2resolver",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "node",
            "type": "bytes32"
          }
        ],
        "name": "addr",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "node",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "stateRoot",
                "type": "bytes32"
              },
              {
                "components": [
                  {
                    "internalType": "uint256",
                    "name": "batchIndex",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes32",
                    "name": "batchRoot",
                    "type": "bytes32"
                  },
                  {
                    "internalType": "uint256",
                    "name": "batchSize",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "prevTotalElements",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes",
                    "name": "extraData",
                    "type": "bytes"
                  }
                ],
                "internalType": "struct OptimismVerifierI.ChainBatchHeader",
                "name": "stateRootBatchHeader",
                "type": "tuple"
              },
              {
                "components": [
                  {
                    "internalType": "uint256",
                    "name": "index",
                    "type": "uint256"
                  },
                  {
                    "internalType": "bytes32[]",
                    "name": "siblings",
                    "type": "bytes32[]"
                  }
                ],
                "internalType": "struct OptimismVerifierI.ChainInclusionProof",
                "name": "stateRootProof",
                "type": "tuple"
              },
              {
                "internalType": "bytes",
                "name": "stateTrieWitness",
                "type": "bytes"
              },
              {
                "internalType": "bytes",
                "name": "storageTrieWitness",
                "type": "bytes"
              }
            ],
            "internalType": "struct OptimismVerifierI.L2StateProof",
            "name": "proof",
            "type": "tuple"
          }
        ],
        "name": "addrWithProof",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "gateway",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "l2resolver",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "verifier",
        "outputs": [
          {
            "internalType": "contract OptimismVerifierI",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "0xd1aab3f428f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb00000000000000000000000000000000000000000000000000000000000000404a02658393f29cc2e01e48b78f8ea44108ec2f16708e9e42bc937bc0cfc8841000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000003726df03cdf0ffda6bf7b65d37bae13c7d71daed622d507678eb4cf7599e269d20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000618b374f00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001d0a4512c8fdcb7a5ce43d840c835863ca189db1afd1986578b12797a92bb71c400000000000000000000000000000000000000000000000000000000000001e7f901e4b90174f90171a0b4a46c4e7ed187e230373030b0bfd89a7a804537e6200448da2823ed999965eb8080a000b64fd211b3b1f6ff8ca19fe4f52484fed2a04ea47c50b7623a503afb034152a0eb850d753201d7d1f7931003e6f769ff22d0e83f544eb0ab5f1f7210b570bc4a80a01776976f1e057584aaac299f7cb286798a4dabe861ee1ef2a69d0c3bb110b3a180a0b9588a2bf7627ae58bec2b3942ca9f0a4ce2c927846c158de0ebd28d03813d4ba0c1f850f7706aef1d0196c207279ca7d51d42ab49e6a054666c21382e8b3531a080a01a11c6fa7e995dc72d87dacf78e1d2a711d49a3a296e03cda5887894bb7827afa0da94a41cb33e5ea9c05f8159b96eb0010c9542009cfeb18b65379997d586236ba075a9bf9e18741341576feaaf3db69e3bd128547862c4452c3132cad6e0d9cafba051e6f527bb96abb0e7fc6900877cd0bc24afb7426c8632e0b588f462a29f7b80a0f08a52927a884f67a76633e207326d79db56b44ef910915ec0abbcd40801b8c580b86bf869a038460e45164e07e0e4df7165de40d5863fb7b8ece896a164bf57a134287c68f5b846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a04e68c142d9868bdac09dc340f66f4bb7dae2f680a53970c62be43a700911f85f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000",
  "statusCode": 200,
  "data": {
    "result": "0xd1aab3f428f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb00000000000000000000000000000000000000000000000000000000000000404a02658393f29cc2e01e48b78f8ea44108ec2f16708e9e42bc937bc0cfc8841000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000003726df03cdf0ffda6bf7b65d37bae13c7d71daed622d507678eb4cf7599e269d20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000618b374f00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001d0a4512c8fdcb7a5ce43d840c835863ca189db1afd1986578b12797a92bb71c400000000000000000000000000000000000000000000000000000000000001e7f901e4b90174f90171a0b4a46c4e7ed187e230373030b0bfd89a7a804537e6200448da2823ed999965eb8080a000b64fd211b3b1f6ff8ca19fe4f52484fed2a04ea47c50b7623a503afb034152a0eb850d753201d7d1f7931003e6f769ff22d0e83f544eb0ab5f1f7210b570bc4a80a01776976f1e057584aaac299f7cb286798a4dabe861ee1ef2a69d0c3bb110b3a180a0b9588a2bf7627ae58bec2b3942ca9f0a4ce2c927846c158de0ebd28d03813d4ba0c1f850f7706aef1d0196c207279ca7d51d42ab49e6a054666c21382e8b3531a080a01a11c6fa7e995dc72d87dacf78e1d2a711d49a3a296e03cda5887894bb7827afa0da94a41cb33e5ea9c05f8159b96eb0010c9542009cfeb18b65379997d586236ba075a9bf9e18741341576feaaf3db69e3bd128547862c4452c3132cad6e0d9cafba051e6f527bb96abb0e7fc6900877cd0bc24afb7426c8632e0b588f462a29f7b80a0f08a52927a884f67a76633e207326d79db56b44ef910915ec0abbcd40801b8c580b86bf869a038460e45164e07e0e4df7165de40d5863fb7b8ece896a164bf57a134287c68f5b846f8440180a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a04e68c142d9868bdac09dc340f66f4bb7dae2f680a53970c62be43a700911f85f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000"
  }
}
```
