import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { trueusd } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: trueusd.name,
  name: 'TRUEUSD-TEST',
  endpoints: [trueusd],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
