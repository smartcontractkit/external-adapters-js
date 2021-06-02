import { util } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'

export const DEFAULT_TABLE = "gcp-pdp-weather-dev.geo_weather.NOAA_GFS0P25"

export type Config = {
  table: string

  api: RequestConfig
}

export const makeConfig = (prefix = ''): Config => ({
  table: util.getEnv('TABLE', prefix) || DEFAULT_TABLE,
  api: {}
})
