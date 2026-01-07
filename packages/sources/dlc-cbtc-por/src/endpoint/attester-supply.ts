import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/attester-supply'
import { StringResultResponse } from '../types'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: StringResultResponse
  Settings: typeof config.settings
}

export const attesterSupply = new AdapterEndpoint({
  name: 'attesterSupply',
  transport,
  customInputValidation: (_req, settings): AdapterInputError | undefined => {
    if (!settings.ATTESTER_API_URLS) {
      throw new AdapterInputError({
        statusCode: 400,
        message:
          'ATTESTER_API_URLS environment variable is required for the attesterSupply endpoint',
      })
    }
    return
  },
})
