import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { mintableTransport } from '../transport/mintable'
import { IndexerResponse } from '../transport/supply'

export const inputParameters = new InputParameters(
  {
    token: {
      required: true,
      type: 'string',
      description: 'Name of the token',
    },
    reserves: {
      required: true,
      type: 'string',
      description: 'Name of the reserve data provider',
      options: ['Bitgo'],
    },
    supplyChains: {
      required: true,
      type: 'string',
      array: true,
      description: 'List of chains the token is on',
    },
    supplyChainBlocks: {
      required: true,
      type: 'number',
      array: true,
      description: 'The target block correspond to each chain in supplyChains',
    },
  },
  [
    {
      token: 'token1',
      reserves: 'Bitgo',
      supplyChains: ['1', '56'],
      supplyChainBlocks: [100, 400],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      mintables: {
        [key: string]: {
          mintable: string
          block: number
        }
      }
      reserveInfo: {
        reserveAmount: string
        timestamp: number
      }
      latestRelevantBlocks: {
        [key: string]: number
      }
      supplyDetails: IndexerResponse
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'mintable',
  transport: mintableTransport,
  inputParameters,
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    const { reserves, supplyChains, supplyChainBlocks } = req.requestContext.data
    if (supplyChains.length !== supplyChainBlocks.length) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `supplyChains and supplyChainBlocks do not have the same length`,
      })
    }
    if (reserves === 'Bitgo' && adapterSettings.BITGO_RESERVES_EA_URL.length === 0) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Error: missing environment variable BITGO_RESERVES_EA_URL`,
      })
    }
    return
  },
})
