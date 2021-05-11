import { logger, Validator } from '../external-adapter'
import { AdapterRequest } from '@chainlink/types'

/**
 * Normalizes http status codes.
 *
 * Returns strings in the format (2|3|4|5)XX.
 *
 * @author https://github.com/joao-fontenele/express-prometheus-middleware
 * @param {!number} status - status code of the requests
 * @returns {string} the normalized status code.
 */
export function normalizeStatusCode(status?: number): string {
  if (!status) {
    return '5XX'
  }

  if (status >= 200 && status < 300) {
    return '2XX'
  }

  if (status >= 300 && status < 400) {
    return '3XX'
  }

  if (status >= 400 && status < 500) {
    return '4XX'
  }
  return '5XX'
}

/**
 * Get feed id name based on input params
 * @param input The adapter input request
 * @returns {string}
 */
export const getFeedId = (input: AdapterRequest): string => {
  const commonFeedParams = {
    base: ['base', 'from', 'coin', 'symbol', 'asset'],
    quote: ['quote', 'to', 'convert'],
  }

  // check if string is within array
  function includesCheck(param: string) {
    return Object.keys(input.data).includes(param)
  }

  // run through validdator if input.data object has keys that match potential base and quote parameters
  if (commonFeedParams.base.some(includesCheck) && commonFeedParams.quote.some(includesCheck)) {
    const validator = new Validator(input, commonFeedParams)
    if (validator.error) {
      logger.debug('Unable to validate feed name')
      return JSON.stringify(input)
    }
    if (
      typeof validator.validated.data.base === 'string' &&
      typeof validator.validated.data.quote === 'string'
    )
      return `${validator.validated.data.base.toUpperCase()}/${validator.validated.data.quote.toUpperCase()}`
  }
  return JSON.stringify(input)
}
