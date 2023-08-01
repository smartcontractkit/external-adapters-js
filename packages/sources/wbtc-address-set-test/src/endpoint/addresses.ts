import { config } from '../config'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../transport/addresses'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: any
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'addresses',
  transport: httpTransport,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.ADDRESSES_ENDPOINT) {
      throw new AdapterInputError({
        message: `ADDRESSES_ENDPOINT env var is required for 'addresses' endpoint`,
      })
    }
    return
  },
})
