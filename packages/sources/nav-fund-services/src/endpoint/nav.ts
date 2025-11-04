import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { getApiKeys } from '../transport/creds'
import { navTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    globalFundID: {
      required: true,
      type: 'number',
      description: 'Used to match API_KEY_${fund} SECRET_KEY_${fund} env variables',
    },
  },
  [
    {
      globalFundID: 1234,
    },
  ],
)
export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      navPerShare: number
      nextNavPerShare: number
      navDate: string
      navDateTimestampMs: number
      globalFundID: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: navTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    getApiKeys(req.requestContext.data.globalFundID)
    return
  },
})
