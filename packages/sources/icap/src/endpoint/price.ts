import { generatePriceEndpoint, TpIcapWebsocketGenerics } from '@chainlink/tp-adapter'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

const { inputParameters, transport } = generatePriceEndpoint({
  sourceName: 'icapSource',
  streamName: 'IC',
  sourceOptions: ['BGK', 'GBL', 'HKG', 'JHB'],
})

export const priceEndpoint = new PriceEndpoint<TpIcapWebsocketGenerics>({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters,
})
