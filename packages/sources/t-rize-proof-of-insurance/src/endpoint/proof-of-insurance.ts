import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/proof-of-insurance'

export const inputParameters = new InputParameters(
  {
    owner_party_id: {
      required: true,
      type: 'string',
      description: 'Party ID that owns the MerkleTree contract on the ledger',
    },
    tree_id: {
      required: true,
      type: 'string',
      description: 'Tree identifier for the merkle tree',
    },
  },
  [
    {
      owner_party_id:
        'TRIZEGroup-cantonTestnetValidator-1::12205de11e389c7da899c66b0fec93ac08b8e9023e8deb30a1316ed9925955fbf06b',
      tree_id: 'tree-001',
    },
  ],
)

// Mapped to Chainlink SmartData v9 report schema:
// https://docs.chain.link/data-streams/reference/report-schema-v9
//
// API field    -> v9 field      | Encoding
// root         -> navPerShare   | base64 decoded to bytes, truncated to 24 bytes, then validated as positive int192 BigInt string
// contractId   -> aum           | hex string truncated to 48 hex chars, then validated as positive int192 BigInt string
// computedAt   -> navDate       | ISO-8601 parsed to nanosecond uint64
// (hardcoded)  -> ripcord       | 0 (normal state)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      navPerShare: string
      aum: string
      navDate: string
      ripcord: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'proof-of-insurance',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
