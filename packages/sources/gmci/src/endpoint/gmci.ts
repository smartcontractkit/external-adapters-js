import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { gmciTransport } from '../transport/gmci'
import { inputParameters } from './shared'

export const endpoint = new AdapterEndpoint({
  name: 'gmci',
  aliases: [],
  transport: gmciTransport,
  inputParameters,
})
