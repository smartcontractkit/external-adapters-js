import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import types from '@chainlink/types'
import { NAME } from './endpoint/example'

const ENV_PROJECT_ID = 'PROJECT_ID'

export const DEFAULT_ENDPOINT = NAME

export type Config = types.Config & {
  projectId: string
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || 'https://storage.scrapinghub.com'
  return {
    ...config,
    projectId: util.getRequiredEnv(ENV_PROJECT_ID),
  }
}
