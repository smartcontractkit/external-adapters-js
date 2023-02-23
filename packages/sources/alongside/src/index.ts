import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { collateral } from './endpoint'
import { customSettings } from './config'

export const adapter = new Adapter({
  defaultEndpoint: collateral.name,
  name: 'ALONGSIDE',
  customSettings,
  endpoints: [collateral],
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
