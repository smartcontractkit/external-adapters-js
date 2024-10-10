import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'

import { totalReserveTransport, inputParameters } from '../transport/total_reserve'

export const endpoint = new AdapterEndpoint({
  name: 'total_reserve',
  transport: totalReserveTransport,
  inputParameters,
})
