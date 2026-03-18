import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

export const getCardanoRpcUrl = (settings: typeof config.settings) => {
  if (!settings.CARDANO_RPC_URL) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Environment variable CARDANO_RPC_URL is missing',
    })
  }
  return settings.CARDANO_RPC_URL
}
