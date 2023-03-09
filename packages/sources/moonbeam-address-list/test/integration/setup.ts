import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../../src/config'
import { addressEndpoint } from '../../src/endpoint/address'

export const createAdapter = () => {
  return new Adapter({
    name: 'TEST',
    defaultEndpoint: 'address',
    endpoints: [addressEndpoint],
    config,
  })
}
