import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/proof-of-insurance'

const inputParameters = new InputParameters(
  {
    ownerPartyId: {
      required: true,
      type: 'string',
      description: 'Party ID that owns the MerkleTree contract on the ledger',
    },
    treeId: {
      required: true,
      type: 'string',
      description: 'Tree identifier for the merkle tree',
    },
  },
  [
    {
      ownerPartyId:
        'TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      treeId: 'tree-001',
    },
  ],
)

// Returns T-Rize carrier values; any downstream schema renaming happens in the jobspec.

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      root: string
      contractId: string
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
