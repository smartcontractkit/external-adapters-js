import { Config } from '@chainlink/types'
import { dnsquery } from '@chainlink/ea'

export const makeConfig = (): Config => {
  return dnsquery.makeConfig()
}
