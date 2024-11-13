import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { solvHttpTransport } from '../transport/solvBTC'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'solvBtcAddress',
  transport: solvHttpTransport,
})
