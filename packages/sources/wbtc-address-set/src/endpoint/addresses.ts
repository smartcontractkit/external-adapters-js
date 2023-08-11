import { config } from '../config'
import { httpTransport } from '../transport/addresses'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
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
