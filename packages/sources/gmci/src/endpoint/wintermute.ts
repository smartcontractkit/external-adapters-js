import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { wintermuteTransport } from '../transport/wintermute'
import { inputParameters } from './shared'

export const endpoint = new AdapterEndpoint({
  name: 'wintermute',
  aliases: [],
  transport: wintermuteTransport,
  inputParameters,
})
