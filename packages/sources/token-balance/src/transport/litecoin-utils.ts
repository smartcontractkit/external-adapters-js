import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const getLitecoinRpcUrl = (settings: typeof config.settings) => {
  if (!settings.LITECOIN_RPC_URL) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Environment variable LITECOIN_RPC_URL is missing',
    })
  }
  return settings.LITECOIN_RPC_URL
}
