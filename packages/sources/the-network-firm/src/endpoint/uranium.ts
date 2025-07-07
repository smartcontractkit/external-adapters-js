import { PoRProviderEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { inputParameters } from '../transport/common'
import { httpTransport } from '../transport/uranium'

export const endpoint = new PoRProviderEndpoint({
  name: 'uranium',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.URANIUM_API_KEY) {
      throw new AdapterInputError({
        statusCode: 500,
        message: 'missing URANIUM_API_KEY env var',
      })
    }
    return
  },
})
