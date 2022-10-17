import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { accountsRestEndpoint } from './endpoint/accounts'
import { customSettings } from './config'
import { expose } from '@chainlink/external-adapter-framework'

export const adapter = new Adapter({
  name: 'bank-frick',
  defaultEndpoint: 'accounts',
  endpoints: [accountsRestEndpoint],
  customSettings,
  envDefaultOverrides: {
    API_ENDPOINT: 'https://olbsandbox.bankfrick.li/webapi/v2',
  },
})

export const server = () => expose(adapter)
