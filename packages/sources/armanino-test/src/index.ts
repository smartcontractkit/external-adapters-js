import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { mco2, stbt } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: mco2.name,
  name: 'ARMANINO-TEST',
  config,
  endpoints: [mco2, stbt],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
