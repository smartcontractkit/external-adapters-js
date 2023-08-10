import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { trueusd } from './endpoint'
import { config } from './config'

export const adapter = new Adapter({
  defaultEndpoint: trueusd.name,
  name: 'TRUEUSD',
  config,
  endpoints: [trueusd],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
