import { Config as BaseConfig } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/external-adapter'

export const ENV_CSV_URL = 'CSV_URL'

export type Config = BaseConfig & {
  csvURL: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    csvURL: util.getRequiredEnv(ENV_CSV_URL, prefix),
  }
}
