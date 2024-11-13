import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { bedrockHttpTransport } from '../transport/bedrockUniBTC'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'bedrockBtcAddress',
  transport: bedrockHttpTransport,
})
