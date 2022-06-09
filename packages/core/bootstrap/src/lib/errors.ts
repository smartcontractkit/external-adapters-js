import * as process from 'process'

export const HTTP_ERROR_NOT_IMPLEMENTED = 501

export const HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE = 415
export const HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE =
  'Only application/json media type is supported.'

export const RPCErrorMap = {
  NETWORK_ERROR: `The provided RPC_URL environment variable ${
    process.env.RPC_URL || process.env.ETHEREUM_RPC_URL
  } could not be connected to.`,
  TIMEOUT: 'Timeout exceeded',
}
