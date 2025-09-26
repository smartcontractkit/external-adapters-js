import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { reserveTransport } from '../transport/reserve'

export const inputParameters = new InputParameters(
  {
    fundId: {
      required: true,
      type: 'number',
      description: 'The fund id of the reserves to query',
    },
  },
  [
    {
      fundId: 3,
    },
  ],
)

export type ReserveResultResponse = {
  Result: number
  Data: {
    fundId: number
    fundName: string
    totalAUM: number
    totalDate: string
    ripcord: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: ReserveResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserve',
  transport: reserveTransport,
  inputParameters,
})
