import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const getXrplRpcUrl = (settings: typeof config.settings) => {
  if (!settings.XRPL_RPC_URL) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Environment variable XRPL_RPC_URL is missing',
    })
  }
  return settings.XRPL_RPC_URL
}
