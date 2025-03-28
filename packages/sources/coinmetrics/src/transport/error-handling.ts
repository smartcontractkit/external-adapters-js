import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { ResponseError } from './types'

const logger = makeLogger('CoinMetrics Crypto error handling')

export const logPossibleSolutionForKnownErrors = (error: ResponseError) => {
  if (error['type'] === 'wrong_credentials') {
    logger.error(`There is something wrong with your credentials.
      Possible Solution:
      1. Doublecheck your supplied credentials.
      2. Contact Data Provider to ensure your subscription is active
      3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please make contact with us and we will look into it.`)
  }

  if (error['type'] === 'bad_parameter') {
    logger.error(`This error indicates that the supplied asset or metric parameter is incorrect.
      Possible Solution:
      1. Confirm you are using the same symbol found in the job spec with the correct case.
      2. There maybe an issue with the job spec or the Data Provider may have delisted the asset. Reach out to Chainlink Labs.`)
  }
}
