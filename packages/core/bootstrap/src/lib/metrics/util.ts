import { AdapterRequest } from '@chainlink/types'
import { logger, Validator } from '../external-adapter'
import { excludableAdapterRequestProperties } from '../util'

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

  // run through validator if input.data object has keys that match potential base and quote parameters
  if (commonFeedParams.base.some(includesCheck) && commonFeedParams.quote.some(includesCheck)) {
    const validationResult = new Validator(input, commonFeedParams)
    if (validationResult.error) {
      logger.debug('Unable to validate feed name')
      return JSON.stringify(input)
    }

    const { base, quote } = validationResult.validated.data
    /**
     * With batched requests, the base can either be an array of bases, or a single base.
     * Quotes are currently only a string
     */
    if (Array.isArray(base)) {
      const bases = `[${base.map((b: string) => b.toUpperCase()).join('|')}]`
      return typeof quote === 'string' ? `${bases}/${quote.toUpperCase()}` : bases
    }

    if (typeof base === 'string') {
      const upperBase = base.toUpperCase()
      return typeof quote === 'string' ? `${upperBase}/${quote.toUpperCase()}` : upperBase
    }
  }

  const entries = Object.keys(input)
    .filter((prop) => !excludableAdapterRequestProperties[prop])
    .map((k) => [k, input[k as keyof AdapterRequest]])

  return JSON.stringify(Object.fromEntries(entries))
}
