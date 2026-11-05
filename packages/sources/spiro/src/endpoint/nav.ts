import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import type { config } from '../config'
import { navTransport } from '../transport/nav'
import { validateFundId } from './utils'

export const inputParameters = new InputParameters(
  {
    fundId: {
      description: 'Fund id',
      type: 'string',
      required: true,
    },
  },
  [
    {
      fundId: 'michigan-pilot',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      nav: number
      aum: number
      ripcord: boolean
      ripcordAsInt: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  inputParameters,
  transport: navTransport,
  customInputValidation: (req): AdapterInputError | undefined => {
    return validateFundId(req.requestContext.data.fundId)
  },
})
