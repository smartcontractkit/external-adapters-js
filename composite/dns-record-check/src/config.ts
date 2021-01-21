import { Config } from '@chainlink/types'
import { adapters } from '@chainlink/adapters'

export const makeConfig = (): Config => {
  return adapters.dnsquery.makeConfig()
}
