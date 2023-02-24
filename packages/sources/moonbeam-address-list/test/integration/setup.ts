import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../src/config'
import { addressEndpoint } from '../../src/endpoint/address'

export const createAdapter = (): Adapter<typeof customSettings> => {
  return new Adapter({
    name: 'test',
    defaultEndpoint: 'address',
    endpoints: [addressEndpoint],
    customSettings,
  })
}
