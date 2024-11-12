import { AdapterRequest, AdapterResponse, Execute, Requester } from '@chainlink/ea-bootstrap'
import { makeExecute, makeConfig } from '../../src/index'
import type { TInputParameters } from '../../src/adapter'

/**
 * This test illustrates that the adapter returns the same output as the server that was originally defined in the example (Link below).  It does this
 * by making a call to the original CCIP Read gateway server in the example and compares it's output to the external adapter's output.
 * Make sure to run your local optimism node along with the gateway server before trying to run this test.
 *
 * Steps to run local optimism node: https://community.optimism.io/docs/developers/l2/dev-node.html
 * Optimism Gateway example: https://github.com/smartcontractkit/ccip-read/tree/optimism-experimental/examples/optimism-metis-gateway
 *
 */

const OPTIMISM_RESOLVER_STUB_ABI = [
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
]
const RESOLVER_STUB_ADDRESS = '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' // Replace with the address you deploy to

const API_CALL_PARAMS = {
  to: RESOLVER_STUB_ADDRESS,
  data: '0x3b3b57de28f4f6752878f66fd9e3626dc2a299ee01cfe269be16e267e71046f1022271cb',
}

const getOriginalGatewayResponse = async () => {
  const body = {
    jsonrpc: '2.0',
    method: 'durin_call',
    params: [API_CALL_PARAMS],
    id: 1,
  }
  const gatewayServerResp = await Requester.request({
    method: 'post',
    url: process.env.GATEWAY_SERVER_URL || 'http://localhost:8081/query',
    data: body,
  })

  return gatewayServerResp.data as AdapterResponse
}

describe('e2e Optimism Gateway', () => {
  let execute: Execute

  beforeAll(async () => {
    process.env.RPC_URL = 'http://localhost:9545'
    process.env.L2_RPC_URL = 'http://localhost:8545'
    process.env.ADDRESS_MANAGER_CONTRACT = '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Should be constant if you deploy a local optimism node
    execute = makeExecute(makeConfig())
  })

  it('returns the correct response', async () => {
    const expectedResponse: AdapterResponse = await getOriginalGatewayResponse()
    const jobID = '1'
    const requestParams = {
      jobRunId: '1',
      id: jobID,
      data: {
        ...API_CALL_PARAMS,
        abi: OPTIMISM_RESOLVER_STUB_ABI,
      },
    }
    const response = await execute(requestParams as AdapterRequest<TInputParameters>, {})
    expect(response.result).toBe(expectedResponse.result)
  })
})
