import DNS from '@chainlink/dns-query-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (): Config => {
  return DNS.makeConfig()
}
