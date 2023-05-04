import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse, makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import presetIds from '../config/presetids.json'

const logger = makeLogger('CryptoCMCEndpoint')

const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin', 'sym', 'symbol'],
    description: 'The symbol of symbols of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
  cid: {
    description: 'The CMC coin ID (optional to use in place of base)',
    required: false,
    type: 'string',
  },
  slug: {
    description: 'The CMC coin ID (optional to use in place of base)',
    required: false,
    type: 'string',
  },
  resultPath: {
    description: 'The path to the result within the asset quote in the provider response',
    required: false,
    type: 'string',
    options: ['price', 'volume_24h', 'market_cap'],
  },
})

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

type CryptoEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody
  }
}

const chunkArray = <T>(params: T[], size = 120): T[][] =>
  params.length > size ? [params.slice(0, size), ...chunkArray(params.slice(size), size)] : [params]

const resultPathMap = {
  price: 'price',
  crypto: 'price',
  volume: 'volume_24h',
  marketcap: 'market_cap',
} as const

const httpTransport = new HttpTransport<CryptoEndpointTypes>({
  prepareRequests: (params: (typeof inputParameters.validated)[], settings) => {
    const requests = []
    const groupedParams = {
      id: [],
      slug: [],
      symbol: [],
    } as Record<string, (typeof inputParameters.validated)[]>

    for (const param of params) {
      if (param.cid) {
        groupedParams.id.push(param)
      } else if (param.slug) {
        groupedParams.slug.push(param)
      } else if (param.base) {
        groupedParams.symbol.push(param)
      } else {
        logger.error(
          `Params were not able to be classified into ID, Slug or Symbol: (${JSON.stringify(
            param,
          )})`,
        )
      }
    }

    for (const [idType, fullList] of Object.entries(groupedParams)) {
      if (fullList && fullList.length > 0) {
        // CMC does not support more than 120 unique quotes
        const chunkedList = chunkArray(fullList, 120)

        // This could be further optimized in cases with more than 120 entries, to make sure that
        // chunkes are grouped optimally to avoid sending unnecessary converts
        for (const list of chunkedList) {
          requests.push({
            params: list,
            request: {
              baseURL: settings.API_ENDPOINT,
              url: '/cryptocurrency/quotes/latest',
              headers: {
                'X-CMC_PRO_API_KEY': settings.API_KEY,
              },
              params: {
                [idType]: [...new Set(list.map((p) => p.cid || p.slug || p.base))].join(','),
                convert: [...new Set(list.map((p) => p.quote))].join(','),
              },
            },
          })
        }
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

export const endpoint = new CryptoPriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price', 'marketcap', 'volume'],
  requestTransforms: [
    (request) => {
      const { base, cid } = request.requestContext.data
      const normalizedBase = base.toUpperCase()
      const idsMap = presetIds as Record<string, number>
      if (!cid && idsMap[normalizedBase]) {
        request.requestContext.data.cid = idsMap[normalizedBase].toString()
      }

      if (!request.requestContext.data.resultPath) {
        const endpoint =
          (request.body.data as { endpoint: keyof typeof resultPathMap }).endpoint ||
          request.requestContext.endpointName
        request.requestContext.data.resultPath = resultPathMap[endpoint]
      }
    },
  ],
  transport: httpTransport,
  inputParameters: inputParameters,
  overrides: overrides.coinmarketcap,
})
