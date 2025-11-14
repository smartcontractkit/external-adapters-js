import { PoRAddressEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { addressDebugTransport } from '../transport/address-debug'
import { customInputValidation, inputParameters } from './address'

/**
 * This endpoint is meant to be used for debug/diagnostic
 * purposes and not for production feeds.
 */
export const endpoint = new PoRAddressEndpoint({
  name: 'address-debug',
  transport: addressDebugTransport,
  inputParameters,
  customInputValidation,
})
