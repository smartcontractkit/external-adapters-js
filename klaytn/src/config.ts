import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export type CustomConfig = Config & {
  url: string
}

export const makeConfig = (prefix?: string): CustomConfig => {
  return {
    api: {},
    apiKey: util.getRequiredEnv('PRIVATE_KEY', prefix),
    url: util.getEnv('URL', prefix) || 'http://localhost:8551',
  }
}
