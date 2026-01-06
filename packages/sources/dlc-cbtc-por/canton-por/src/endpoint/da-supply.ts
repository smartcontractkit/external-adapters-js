import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/da-supply'
import { StringResultResponse } from '../types'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: StringResultResponse
  Settings: typeof config.settings
}

export const daSupply = new AdapterEndpoint({
  name: 'daSupply',
  aliases: ['daTotalSupply'],
  transport,
  customInputValidation: (_req, settings): AdapterInputError | undefined => {
    if (!settings.CANTON_API_URL) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'CANTON_API_URL environment variable is required for the daSupply endpoint',
      })
    }
    return
  },
})
