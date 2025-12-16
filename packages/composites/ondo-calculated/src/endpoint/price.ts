import { BaseEndpointTypes as DataEngineResponse } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { priceTransport } from '../transport/transport'

export const inputParameters = new InputParameters(
  {
    registry: {
      required: true,
      type: 'string',
      description: 'Ondo on-chain registry address',
    },
    asset: {
      required: true,
      type: 'string',
      description: 'Maps to the asset in ondo’s on-chain registry',
    },
    regularStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams regular hour feed ID for the underlying asset',
    },
    extendedStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams extended hour feed ID for the underlying asset',
    },
    overnightStreamId: {
      required: true,
      type: 'string',
      description: 'Data Streams overnight hour feed ID for the underlying asset',
    },
    decimals: {
      type: 'number',
      description: 'Decimals of output result',
      default: 8,
    },
  },
  [
    {
      registry: '0x0',
      asset: '0x0',
      regularStreamId: '0x0',
      extendedStreamId: '0x0',
      overnightStreamId: '0x0',
      decimals: 8,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      registry: {
        sValue: string
        paused: boolean
      }
      stream: {
        regular: DataEngineResponse['Response']['Data']
        extended: DataEngineResponse['Response']['Data']
        overnight: DataEngineResponse['Response']['Data']
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: priceTransport,
  inputParameters,
})
