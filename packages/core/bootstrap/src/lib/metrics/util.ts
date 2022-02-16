import { AdapterRequest } from '@chainlink/types'
import { logger, Validator } from '../modules'
import { excludableAdapterRequestProperties } from '../util'
import * as crypto from 'crypto'

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
  if (!status || (status >= 200 && status < 300)) {
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
 * Maxiumum number of characters that a feedId can contain.
 */
export const MAX_FEED_ID_LENGTH = 300

/**
 * Fixed label value for cache warmer feed_id
 */
export const WARMER_FEED_ID = 'CACHE_WARMER'

/**
 * Builds a string from the provided data, either a symbol string or an array of them. E.g.:
 *   - "ETH"
 *   - "[BTC|DOGE|ETH]"
 * @param data The input data from validated params
 * @returns {string}
 */
function buildSymbolString(data: string | string[]): string {
  if (Array.isArray(data)) {
    if (data.length > 1) {
      return `[${data
        .map((b: string) => b.toUpperCase())
        .sort((b1, b2) => b1.localeCompare(b2))
        .join('|')}]`
    } else {
      return data[0].toUpperCase()
    }
  }

  return data.toUpperCase()
}

/**
 * Get feed id name based on input params
 * @param input The adapter input request
 * @returns {string}
 */
export const getFeedId = (input: AdapterRequest): string => {
  try {
    const commonFeedParams = {
      base: ['base', 'from', 'coin', 'symbol', 'asset'],
      quote: ['quote', 'to', 'convert'],
    }

    // check if string is within array
    const includesCheck = (param: string) => Object.keys(input.data).includes(param)

    /**
     * If the request is coming from the cache warmer, use a fixed id. This is to reduce the
     * cardinality of the feed_id label in prometheus, which can be overloaded quickly
     */
    if (input.debug?.warmer) {
      return WARMER_FEED_ID
    }

    // run through validator if input.data object has keys that match potential base and quote parameters
    if (commonFeedParams.base.some(includesCheck) && commonFeedParams.quote.some(includesCheck)) {
      const validationResult = new Validator(
        input,
        commonFeedParams,
        {},
        { shouldThrowError: false },
      )
      if (validationResult.error) {
        logger.debug('Unable to validate feed name', {
          input,
          error: validationResult.error.toString(),
        })
        return JSON.stringify(input)
      }

      const { base, quote } = validationResult.validated.data

      /**
       * With batched requests, the base can either be an array of bases, or a single base.
       * The same type constraints apply to the quote param.
       */
      if (base) {
        return `${buildSymbolString(base)}` + (quote ? `/${buildSymbolString(quote)}` : '')
      }
    }

    const entries = Object.keys(input)
      .filter((prop) => !excludableAdapterRequestProperties[prop])
      .map((k) => [k, input[k as keyof AdapterRequest]])

    const rawFeedId = JSON.stringify(Object.fromEntries(entries))

    // If feedId exceed the max length use the md5 hash
    return rawFeedId.length > MAX_FEED_ID_LENGTH
      ? crypto.createHash('md5').update(rawFeedId).digest('hex')
      : rawFeedId
  } catch (error) {
    logger.error('Unable to get feed name', {
      input,
      error: error.toString(),
      stack: error.stack,
    })
    return 'undefined'
  }
}
