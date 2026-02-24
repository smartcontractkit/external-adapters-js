import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import {
  EmptyInputParameters,
  InputParameters,
} from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters({}, [])

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: SingleNumberResultResponse & {
    Data: {
      ripcord: boolean
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
