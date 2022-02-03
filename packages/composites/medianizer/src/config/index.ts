import { HTTP } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'MEDIANIZER'

export const makeConfig = (prefix = ''): Config => {
  return HTTP.getDefaultConfig(prefix)
}
