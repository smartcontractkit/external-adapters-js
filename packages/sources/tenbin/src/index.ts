import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { verifiedBalance } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: verifiedBalance.name,
  name: 'TENBIN',
  config,
  endpoints: [verifiedBalance],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
