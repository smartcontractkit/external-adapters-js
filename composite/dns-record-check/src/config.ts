import { Config } from '@chainlink/types'
import DNS from '@chainlink/dns-query'

export const makeConfig = (): Config => {
  return DNS.makeConfig()
}
