import { PoRAddressEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { addressAdhocTransport } from '../transport/address-adhoc'
import { customInputValidation, inputParameters } from './address'

/**
 * This endpoint is meant to be used for debugging purposes
 * and not for production feeds.
 */
export const endpoint = new PoRAddressEndpoint({
  name: 'address-adhoc',
  transport: addressAdhocTransport,
  inputParameters,
  customInputValidation,
})
