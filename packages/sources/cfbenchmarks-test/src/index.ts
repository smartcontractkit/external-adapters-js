import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto } from './endpoint'
import { requestTransforms } from './endpoint/common/crypto'

export const adapter = new PriceAdapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto],
  defaultEndpoint: crypto.name,
  customSettings,
  requestTransforms,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
