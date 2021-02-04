import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  return config
}
