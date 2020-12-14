import { util } from '@chainlink/ea-bootstrap'

export const CMC_API_KEY = 'CMC_API_KEY'

export type Config = {
  cmcApiKey?: string
}

export const getConfig = (prefix = ''): Config => ({
  cmcApiKey: util.getEnv(CMC_API_KEY, prefix),
})
