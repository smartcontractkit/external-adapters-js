import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'txsend'

export const DEFAULT_RPC_URL = 'http://localhost:4444'
export const DEFAULT_PRIVATE_KEY =
  '0x90125e49d93a24cc8409d1e00cc69c88919c6826d8bbabb6f2e1dc8213809f4c'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  return config
}
