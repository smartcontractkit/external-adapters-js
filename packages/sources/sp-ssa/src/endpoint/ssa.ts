import { NumericResultEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/ssa'

export const inputParameters = new InputParameters(
  {
    security_id: {
      required: true,
      type: 'string',
      description: 'The S&P security id whose SSA score is published, for example SP-EURC',
    },
  },
  [
    {
      security_id: 'SP-EURC',
    },
  ],
)

export type SsaResultResponse = SingleNumberResultResponse & {
  Data: {
    exchangeRate: number
    validFromTimestamp: number
    observationsTimestamp: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SsaResultResponse
  Settings: typeof config.settings
}

export const endpoint = new NumericResultEndpoint({
  name: 'ssa',
  transport: httpTransport,
  inputParameters,
})
