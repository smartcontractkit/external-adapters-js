import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
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
    network: {
      type: 'string',
      description: 'T-Rize source network to query',
      options: ['mainnet', 'testnet'],
      default: 'mainnet',
    },
  },
  [
    {
      ownerPartyId:
        'TRIZEGroup-exampleValidator-1::0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      treeId: 'tree-001',
      network: 'mainnet',
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
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    const network = req.requestContext.data.network || 'mainnet'
    const endpoint =
      network === 'testnet' ? adapterSettings.TESTNET_API_ENDPOINT : adapterSettings.API_ENDPOINT
    if (!endpoint) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: missing ${
          network === 'testnet' ? 'TESTNET_API_ENDPOINT' : 'API_ENDPOINT'
        } environment variable`,
      })
    }
    return
  },
})
