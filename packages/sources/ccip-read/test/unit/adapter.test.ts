import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute, TInputParameters } from '../../src/adapter'
import * as endpoints from '../../src/endpoint'
import testPayload from '../../test-payload.json'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.RPC_URL = 'http://localhost:9545'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'data not supplied',
        testData: {
          id: jobID,
          data: {
            to: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract OptimismVerifierI',
                    name: '_verifier',
                    type: 'address',
                  },
                  {
                    internalType: 'string',
                    name: '_gateway',
                    type: 'string',
                  },
                  {
                    internalType: 'address',
                    name: '_l2resolver',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes32',
                    name: 'node',
                    type: 'bytes32',
                  },
                ],
                name: 'addr',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes32',
                    name: 'node',
                    type: 'bytes32',
                  },
                  {
                    components: [
                      {
                        internalType: 'bytes32',
                        name: 'stateRoot',
                        type: 'bytes32',
                      },
                      {
                        components: [
                          {
                            internalType: 'uint256',
                            name: 'batchIndex',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes32',
                            name: 'batchRoot',
                            type: 'bytes32',
                          },
                          {
                            internalType: 'uint256',
                            name: 'batchSize',
                            type: 'uint256',
                          },
                          {
                            internalType: 'uint256',
                            name: 'prevTotalElements',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes',
                            name: 'extraData',
                            type: 'bytes',
                          },
                        ],
                        internalType: 'struct OptimismVerifierI.ChainBatchHeader',
                        name: 'stateRootBatchHeader',
                        type: 'tuple',
                      },
                      {
                        components: [
                          {
                            internalType: 'uint256',
                            name: 'index',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes32[]',
                            name: 'siblings',
                            type: 'bytes32[]',
                          },
                        ],
                        internalType: 'struct OptimismVerifierI.ChainInclusionProof',
                        name: 'stateRootProof',
                        type: 'tuple',
                      },
                      {
                        internalType: 'bytes',
                        name: 'stateTrieWitness',
                        type: 'bytes',
                      },
                      {
                        internalType: 'bytes',
                        name: 'storageTrieWitness',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct OptimismVerifierI.L2StateProof',
                    name: 'proof',
                    type: 'tuple',
                  },
                ],
                name: 'addrWithProof',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'gateway',
                outputs: [
                  {
                    internalType: 'string',
                    name: '',
                    type: 'string',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'l2resolver',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'verifier',
                outputs: [
                  {
                    internalType: 'contract OptimismVerifierI',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ],
          },
        },
      },
      {
        name: 'abi not supplied',
        testData: {
          id: jobID,
          data: {
            to: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
            data: '0x3b3b57de28f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb',
          },
        },
      },
      {
        name: 'to not supplied',
        testData: {
          id: jobID,
          data: {
            data: '0x3b3b57de28f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb',
            abi: [
              {
                inputs: [
                  {
                    internalType: 'contract OptimismVerifierI',
                    name: '_verifier',
                    type: 'address',
                  },
                  {
                    internalType: 'string',
                    name: '_gateway',
                    type: 'string',
                  },
                  {
                    internalType: 'address',
                    name: '_l2resolver',
                    type: 'address',
                  },
                ],
                stateMutability: 'nonpayable',
                type: 'constructor',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes32',
                    name: 'node',
                    type: 'bytes32',
                  },
                ],
                name: 'addr',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [
                  {
                    internalType: 'bytes32',
                    name: 'node',
                    type: 'bytes32',
                  },
                  {
                    components: [
                      {
                        internalType: 'bytes32',
                        name: 'stateRoot',
                        type: 'bytes32',
                      },
                      {
                        components: [
                          {
                            internalType: 'uint256',
                            name: 'batchIndex',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes32',
                            name: 'batchRoot',
                            type: 'bytes32',
                          },
                          {
                            internalType: 'uint256',
                            name: 'batchSize',
                            type: 'uint256',
                          },
                          {
                            internalType: 'uint256',
                            name: 'prevTotalElements',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes',
                            name: 'extraData',
                            type: 'bytes',
                          },
                        ],
                        internalType: 'struct OptimismVerifierI.ChainBatchHeader',
                        name: 'stateRootBatchHeader',
                        type: 'tuple',
                      },
                      {
                        components: [
                          {
                            internalType: 'uint256',
                            name: 'index',
                            type: 'uint256',
                          },
                          {
                            internalType: 'bytes32[]',
                            name: 'siblings',
                            type: 'bytes32[]',
                          },
                        ],
                        internalType: 'struct OptimismVerifierI.ChainInclusionProof',
                        name: 'stateRootProof',
                        type: 'tuple',
                      },
                      {
                        internalType: 'bytes',
                        name: 'stateTrieWitness',
                        type: 'bytes',
                      },
                      {
                        internalType: 'bytes',
                        name: 'storageTrieWitness',
                        type: 'bytes',
                      },
                    ],
                    internalType: 'struct OptimismVerifierI.L2StateProof',
                    name: 'proof',
                    type: 'tuple',
                  },
                ],
                name: 'addrWithProof',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'gateway',
                outputs: [
                  {
                    internalType: 'string',
                    name: '',
                    type: 'string',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'l2resolver',
                outputs: [
                  {
                    internalType: 'address',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [],
                name: 'verifier',
                outputs: [
                  {
                    internalType: 'contract OptimismVerifierI',
                    name: '',
                    type: 'address',
                  },
                ],
                stateMutability: 'view',
                type: 'function',
              },
            ],
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})

describe('test-payload.json', () => {
  it('should contain all endpoints/aliases', () => {
    const endpointsWithAliases = Object.keys(endpoints)
      .map((e) => [...(endpoints[e as keyof typeof endpoints].supportedEndpoints || [])])
      .flat()
    endpointsWithAliases.forEach((alias) => {
      const requests = testPayload.requests as { data: { endpoint?: string } }[]
      const aliasedRequest = requests.find((req) => req?.data?.endpoint === alias)
      expect(aliasedRequest).toBeDefined()
    })
  })
})
