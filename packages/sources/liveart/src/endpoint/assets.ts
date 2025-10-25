import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../transport/assets'

// Assets endpoint has no input params
export const assets = new AdapterEndpoint({
  name: 'assets',
  transport: httpTransport,
})
