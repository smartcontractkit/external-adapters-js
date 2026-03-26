import nock from 'nock'
import type { ResponseSchema } from '../../src/transport/cumulativeAmount'

const eip712AttestationPayload = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    NAVAttestation: [
      { name: 'contractAddress', type: 'address' },
      { name: 'navContractAddress', type: 'address' },
      { name: 'decimals', type: 'uint8' },
      { name: 'amount', type: 'uint256' },
      { name: 'cumulativeAmount', type: 'uint256' },
      { name: 'validFrom', type: 'uint256' },
      { name: 'validTo', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  },
  primaryType: 'NAVAttestation',
  domain: {
    name: 'RWA Attestation',
    version: '1',
    chainId: '1',
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  message: {
    contractAddress: '0xd051c326C9Aef673428E6F01eb65d2C52De95D30',
    navContractAddress: '0x95dc5a797f657391fb5a20bf2846475bb26c8b1a',
    decimals: 8,
    amount: '2479938340000',
    cumulativeAmount: '5954903980000',
    validFrom: '1765429200',
    validTo: '0',
    nonce: '0x03f506db0529a245a5afc10348f5426b13e6b18abe63a4670562422cc8826de1',
  },
}

export const tursoPipelineSuccessResponse: ResponseSchema = {
  results: [
    {
      type: 'ok',
      response: {
        type: 'execute',
        result: {
          cols: [
            {
              name: 'attestation_data',
              decltype: 'TEXT',
            },
            {
              name: 'signature',
              decltype: 'TEXT',
            },
          ],
          rows: [
            [
              {
                type: 'text',
                value: JSON.stringify(eip712AttestationPayload),
              },
              {
                type: 'text',
                value:
                  '0xe4181569bcba9819eb8629cd1ce16d45798fb23904a16143c40781c369dee8e431fe72040ee729157b568e25179c1ce2ad831db5290897d5324a187b3d5e922b1b',
              },
            ],
          ],
          affected_row_count: 0,
          last_insert_rowid: null,
          replication_index: null,
          rows_read: 28,
          rows_written: 0,
          query_duration_ms: 0.153,
        },
      },
    },
    {
      type: 'ok',
      response: {
        type: 'close',
      },
    },
  ],
}

export const mockTursoPipelineSuccess = (): nock.Scope =>
  nock('https://test.url')
    .post('/')
    .matchHeader('Authorization', /^Bearer /)
    .reply(200, tursoPipelineSuccessResponse, ['Content-Type', 'application/json'])
