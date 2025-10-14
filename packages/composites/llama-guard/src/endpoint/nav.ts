import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getEAUrl } from '../transport/ea'
import { navTransport } from '../transport/transport'

export const inputParameters = new InputParameters(
  {
    source: {
      required: true,
      type: 'string',
      description:
        'Name of the Adapters that provides Nav data, requires ${source}_EA_URL in env var',
    },
    sourceInput: {
      required: true,
      type: 'string',
      description: 'JSON input to Adapters in string format',
    },
    sourceScaled: {
      type: 'boolean',
      description: 'Adapter return nav data scaled to output decimals or not',
      default: false,
    },
    asset: {
      required: true,
      type: 'string',
      description: "Address of asset in LlamaGuard's ParameterRegistry",
    },
    registry: {
      required: true,
      type: 'string',
      description: "Contract address of LlamaGuard's ParameterRegistry",
    },
  },
  [
    {
      source: 'name',
      sourceInput: "{'param': '1'}",
      sourceScaled: false,
      asset: '0x0',
      registry: '0x1',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      rawNav: string
      lowerBound?: string
      upperBound?: string
      bases: {
        lookback: {
          nav: string
          ts: number
        }
        previous: {
          nav: string
          ts: number
        }
      }
      adjustedNav: string
      riskFlag: boolean
      breachDirection: string
      isBounded: boolean
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  aliases: [],
  transport: navTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    getEAUrl(req.requestContext.data.source)
    try {
      JSON.parse(req.requestContext.data.sourceInput)
    } catch (ex) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `sourceInput is not in JSON format: ${ex}`,
      })
    }

    return
  },
})
