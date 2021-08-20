import { util } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'

export const DEFAULT_DATASET = 'bigquery-public-data.noaa_gsod'

export type Config = {
  dataset: string

  api: RequestConfig
}

export const makeConfig = (prefix = ''): Config => ({
  dataset: util.getEnv('DATASET', prefix) || DEFAULT_DATASET,
  api: {},
})
