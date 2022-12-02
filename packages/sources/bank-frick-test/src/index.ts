import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { accountsRestEndpoint } from './endpoint/accounts'
import { customSettings } from './config'
import { expose } from '@chainlink/external-adapter-framework'

export const adapter = new Adapter({
  name: 'BANK_FRICK',
  defaultEndpoint: 'accounts',
  endpoints: [accountsRestEndpoint],
  customSettings,
})

export const server = () => expose(adapter)
