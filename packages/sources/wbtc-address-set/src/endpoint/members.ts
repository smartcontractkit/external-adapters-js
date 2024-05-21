import { config } from '../config'
import { httpTransport } from '../transport/members'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'members',
  transport: httpTransport,
  customInputValidation: (_, adapterSettings): AdapterInputError | undefined => {
    if (!adapterSettings.MEMBERS_ENDPOINT) {
      throw new AdapterInputError({
        message: `MEMBERS_ENDPOINT env var is required for 'members' endpoint`,
      })
    }
    return
  },
})
