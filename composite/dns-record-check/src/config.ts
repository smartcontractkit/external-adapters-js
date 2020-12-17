import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (): Config => {
  return Requester.getDefaultConfig()
}
