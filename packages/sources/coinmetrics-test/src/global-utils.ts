import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterDataProviderError } from '@chainlink/external-adapter-framework/validation/error'
import { ResponseSchema } from './endpoint/price'

const logger = makeLogger('Coinmetrics Global Util')

const missingDataErrorMsg = 'Data provider response empty'
const missingResultsErrorMsg =
  'Result could not be found in path or is empty. This is likely an issue with the data provider or the input params/overrides.'
const invalidResultError =
  'Invalid result received. This is likely an issue with the data provider or the input params/overrides.'

// Placeholder. Will replace this when v3 framework is updated
export const validateResultNumber = (data: ResponseSchema, metric: string): number => {
  if (!data.data || !data.data.length) {
    logger.error(missingDataErrorMsg, { data, metric })
    throw new AdapterDataProviderError({
      message: missingDataErrorMsg,
      statusCode: 502,
    })
  }

  const result = data.data[0][metric as 'ReferenceRateUSD' | 'ReferenceRateEUR']

  if (typeof result === 'undefined' || result === null) {
    logger.error(missingResultsErrorMsg, { data, metric })
    throw new AdapterDataProviderError({
      message: missingResultsErrorMsg,
      statusCode: 502,
    })
  }

  const num = Number(result)

  if (num === 0 || isNaN(num)) {
    logger.error(invalidResultError, { data, metric })
    throw new AdapterDataProviderError({
      message: invalidResultError,
      statusCode: 400,
    })
  }

  return num
}
