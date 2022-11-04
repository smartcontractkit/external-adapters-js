import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { SettingsMap } from '@chainlink/external-adapter-framework/config'
import { customSettings } from './config'
import { crypto } from './endpoint'

export const makeAdapter = (): PriceAdapter<SettingsMap> =>
  new PriceAdapter({
    name: 'CFBENCHMARKS',
    endpoints: [crypto],
    defaultEndpoint: crypto.name,
    customSettings,
  })

export const server = (): Promise<ServerInstance | undefined> => expose(makeAdapter())
