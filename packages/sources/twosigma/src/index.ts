import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { makePriceEndpoint } from './endpoint'

export const makeAdapter = (): PriceAdapter<typeof customSettings> => {
  const priceEndpoint = makePriceEndpoint()
  return new PriceAdapter({
    name: 'TWOSIGMA',
    endpoints: [priceEndpoint],
    defaultEndpoint: priceEndpoint.name,
    customSettings,
  })
}

export const adapter = makeAdapter()

export const server = (): Promise<ServerInstance | undefined> => expose(makeAdapter())
