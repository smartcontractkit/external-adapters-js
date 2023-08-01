import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { httpTransport } from '../transport/members'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: any
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
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
