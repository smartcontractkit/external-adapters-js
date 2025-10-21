import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport, HttpTransportTypes } from '../transport/asset'

// Assets endpoint has no input params
export const assets = new AdapterEndpoint<HttpTransportTypes>({
  name: 'assets',
  transport: httpTransport,
})
