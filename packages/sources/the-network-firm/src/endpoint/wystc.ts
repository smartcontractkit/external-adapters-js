import { PoRProviderEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { inputParameters } from '../transport/common'
import { httpTransport } from '../transport/wystc'

export const endpoint = new PoRProviderEndpoint({
  name: 'wystc',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.WYSTC_API_KEY) {
      throw new AdapterInputError({
        statusCode: 500,
        message: 'missing WYSTC_API_KEY env var',
      })
    }
    return
  },
})
