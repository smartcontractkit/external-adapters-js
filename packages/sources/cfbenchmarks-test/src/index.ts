import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { crypto, birc } from './endpoint'
import { requestTransforms } from './endpoint/common/crypto'

export const adapter = new Adapter({
  name: 'CFBENCHMARKS',
  endpoints: [crypto, birc],
  defaultEndpoint: crypto.name,
  customSettings,
  requestTransforms,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
