import { Config } from '@chainlink/types'
import DNS from '@chainlink/dns-query-adapter'

export const makeConfig = (): Config => {
  return DNS.makeConfig()
}
