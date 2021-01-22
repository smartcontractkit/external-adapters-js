import { Config } from '@chainlink/types'
import { adapters } from '@chainlink/ea'

export const makeConfig = (): Config => {
  return adapters.dnsquery.makeConfig()
}
