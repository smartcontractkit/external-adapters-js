import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from './config'
import { por } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: por.name,
  name: 'ARTEX_AMINA',
  config,
  endpoints: [por],
  bootstrap: async (adapterInstance) => {
    if (adapterInstance.config.settings.RETRY !== 0) {
      throw new Error(
        'AMINA requires RETRY=0: framework retries replay the signed nonce/timestamp/signature',
      )
    }
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
