import {
  HttpTransport,
  ProviderRequestConfig,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/crypto'

const logger = makeLogger('CryptoCMCEndpoint')

interface PriceInfo {
  price: number
  volume_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  percent_change_30d: number
  market_cap: number
}

interface ProviderResponseBody {
  data: {
    [key: string]: {
      id: number
      name: string
      symbol: string
      slug: string
      is_active: number
      is_fiat: number
      circulating_supply: number
      total_supply: number
      max_supply: number
      date_added: string
      num_market_pairs: number
      cmc_rank: number
      last_updated: string
      tags: string[]
      platform: string
      quote: {
        [key: string]: PriceInfo
      }
    }
  }
  status: {
    timestamp: string
    error_code: number
    error_message: string
    elapsed: number
    credit_count: number
  }
  cost: number
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

const getGroupKey = (params: typeof inputParameters.validated): string | undefined => {
  const quote = params.quote.toUpperCase()
  if (params.cid) {
    return JSON.stringify({
      idType: 'id',
      quote,
    })
  }
  if (params.slug) {
    return JSON.stringify({
      idType: 'slug',
      quote,
    })
  }
  if (params.base) {
    return JSON.stringify({
      idType: 'symbol',
      quote,
    })
  }

  return undefined
}

export const httpTransport = new HttpTransport<HttpTransportTypes>({
  prepareRequests: (params: (typeof inputParameters.validated)[], settings) => {
    const requests: ProviderRequestConfig<HttpTransportTypes>[] = []
    const groupedParams: Record<string, (typeof inputParameters.validated)[]> = {}

    for (const param of params) {
      const key = getGroupKey(param)
      if (!key) {
        logger.error(
          `Params were not able to be classified into ID, Slug or Symbol: (${JSON.stringify(
            param,
          )})`,
        )
        continue
      }
      if (!(key in groupedParams)) {
        groupedParams[key] = []
      }
      groupedParams[key].push(param)
    }

    for (const [key, list] of Object.entries(groupedParams)) {
      const { idType, quote } = JSON.parse(key)
      if (list && list.length > 0) {
        const batchedBaseCurrencies = [...new Set(list.map((p) => p.cid || p.slug || p.base))].join(
          ',',
        )
        requests.push({
          params: list,
          request: {
            baseURL: settings.API_ENDPOINT,
            url: '/cryptocurrency/quotes/latest',
            headers: {
              'X-CMC_PRO_API_KEY': settings.API_KEY,
            },
            params: {
              [idType]: batchedBaseCurrencies,
              convert: quote,
            },
          },
        })
      }
    }

    return requests
  },
  parseResponse: (params, res) => {
    logger.debug(`CMC api call cost: ${res.data.cost}`)

    // Use the mapping to generate the responses
    return params.map((p) => {
      const data = res.data.data[p.cid || p.slug || p.base]
      if (!data) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data was not found in response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      const dataForQuote = data.quote[p.quote]
      if (!dataForQuote) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Data for quote "${
              p.quote
            }" was not found in response for request: ${JSON.stringify(p)}`,
          },
        }
      }

      // We always set a value for the resultPath in the request transform
      const resultPath =
        p.resultPath as (typeof inputParameters.definition.resultPath.options)[number]
      const valueRequested = dataForQuote[resultPath]
      if (valueRequested == null) {
        return {
          params: p,
          response: {
            statusCode: 502,
            errorMessage: `Value for "${resultPath}" was not found in the quote request: ${JSON.stringify(
              p,
            )}`,
          },
        }
      }

      // We're adding multiple results because the same provider endpoint provides values for several adapter endpoints
      // Price
      return {
        params: p,
        response: {
          result: dataForQuote[resultPath],
          data: {
            result: dataForQuote[resultPath],
          },
        },
      }
    })
  },
})
