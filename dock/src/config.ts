import * as dotenv from 'dotenv'
import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'
import { DockConfig } from 'dock/types'

dotenv.config()

// Minimum answers (from different sources) required for price feed.
export const MinimumAnswersForPriceFeed = 2

export const makeCMCConfig = (): Config => {
  const config = Requester.getDefaultConfig('CMC', true)
  config.api.headers = {
    'X-CMC_PRO_API_KEY': config.apiKey,
  }
  return config
}

export const makeConfig = (prefix = '', requireKey = false): Config => {
  const config = Requester.getDefaultConfig(prefix, requireKey)
  return config
}

export const makeDockConfig = (): DockConfig => {
  return {
    NODE_ENDPOINT: util.getEnv('NODE_ENDPOINT') as string,
    ORACLE_SK: util.getEnv('ORACLE_SK') as string,
    ORACLE_ADDRESS: util.getEnv('ORACLE_ADDRESS') as string,
    AGGREGATOR_ADDRESS: util.getEnv('AGGREGATOR_ADDRESS') as string,
    AGGREGATOR_ABI: JSON.parse(util.getEnv('AGGREGATOR_ABI') as string),
  }
}

export const minimumAnswers = (): number => {
  return parseInt(util.getEnv('MinimumAnswersForPriceFeed') as string) || MinimumAnswersForPriceFeed
}
