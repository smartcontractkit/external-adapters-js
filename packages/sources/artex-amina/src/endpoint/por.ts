import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import type { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import type { config } from '../config'
import { porTransport } from '../transport/por'

export const inputParameters = new InputParameters(
  {
    portfolioNo: {
      required: true,
      type: 'number',
      description: 'AMINA portfolio number',
    },
    isin: {
      required: true,
      type: 'string',
      description: 'ISIN of the position to publish',
    },
  },
  [
    {
      portfolioNo: 157769305,
      isin: 'US0378331005',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      aum: number
      ripcord: number
      navPerShare: number
      navDate: number
      nativeFee: number
      linkFee: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'por',
  transport: porTransport,
  inputParameters,
})
