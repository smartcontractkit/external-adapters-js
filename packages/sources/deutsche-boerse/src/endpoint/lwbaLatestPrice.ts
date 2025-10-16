import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { lwbaLatestPriceProtobufWsTransport } from '../transport/lwbaLatestPrice'
import { inputParameters } from './lwba'

export const endpoint = new AdapterEndpoint({
  name: 'lwba_latest_price',
  aliases: [],
  transport: lwbaLatestPriceProtobufWsTransport,
  inputParameters,
})
