import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { ushpTransport } from '../transport/ushp'
import { BaseEndpointTypes, inputParameters } from './types'

export const ushpEndpoint = new AdapterEndpoint<BaseEndpointTypes>({
  name: 'ushp',
  transport: ushpTransport,
  inputParameters,
})
