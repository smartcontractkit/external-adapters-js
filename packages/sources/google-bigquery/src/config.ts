import { util } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'

export const NAME = 'GOOGLE_BIGQUERY'

export type Config = {
  projectId?: string
  keyFilename?: string
  email?: string
  autoRetry: boolean
  maxRetries: number
  location?: string

  api: RequestConfig
}

export const makeConfig = (prefix?: string): Config => ({
  projectId: util.getEnv('PROJECT_ID', prefix),
  keyFilename: util.getEnv('KEY_FILENAME', prefix),
  autoRetry: util.parseBool(util.getEnv('AUTO_RETRY', prefix) || true),
  maxRetries: parseInt(util.getEnv('MAX_RETRIES', prefix) || '3'),
  location: util.getEnv('LOCATION', prefix),
  api: {},
})
