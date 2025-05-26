import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { httpTransport } from '../transport/emgemx'

export const inputParameters = new InputParameters({})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'emgemx',
  transport: httpTransport,
  inputParameters,
  customInputValidation: (_, adapterSettings): AdapterError | undefined => {
    if (!adapterSettings.EMGEMX_API_KEY) {
      throw new AdapterError({
        statusCode: 500,
        message: 'missing EMGEMX_API_KEY env var',
      })
    }
    return
  },
})
