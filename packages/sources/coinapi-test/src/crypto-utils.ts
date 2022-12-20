import { customSettings } from './config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const inputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
} as const

export interface ProviderResponseBody {
  asset_id_base: string
  rates: { time: string; asset_id_quote: string; rate: number }[]
}

export interface RequestParams {
  base: string
  quote: string
}

export interface ProviderRequestBody {
  filter_asset_id: string
  apikey: string
}

export type EndpointTypes = {
  Request: {
    Params: RequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: ProviderRequestBody
    ResponseBody: ProviderResponseBody
  }
}

const charsToEncode = {
  ':': '%3A',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '[': '%5B',
  ']': '%5D',
  '@': '%40',
  '!': '%21',
  $: '%24',
  '&': '%26',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
  '+': '%2B',
  ',': '%2C',
  ';': '%3B',
  '=': '%3D',
  '%': '%25',
  ' ': '%20',
  '"': '%22',
  '<': '%3C',
  '>': '%3E',
  '{': '%7B',
  '}': '%7D',
  '|': '%7C',
  '^': '%5E',
  '`': '%60',
  '\\': '%5C',
}

const stringHasWhitelist = (str: string, whitelist: string[]): boolean =>
  whitelist.some((el) => str.includes(el))

export const buildUrlPath = (pathTemplate = '', params = {}, whitelist = ''): string => {
  const allowedChars = whitelist.split('')

  for (const param in params) {
    const value = params[param as keyof typeof params]
    if (!value) continue

    // If string contains a whitelisted character: manually replace any non-whitelisted characters with percent encoded values. Otherwise, encode the string as usual.
    const encodedValue = stringHasWhitelist(value, allowedChars)
      ? percentEncodeString(value, allowedChars)
      : encodeURIComponent(value)

    pathTemplate = pathTemplate.replace(`:${param}`, encodedValue)
  }

  return pathTemplate
}

const percentEncodeString = (str: string, whitelist: string[]): string =>
  str
    .split('')
    .map((char) => {
      const encodedValue = charsToEncode[char as keyof typeof charsToEncode]
      return encodedValue && !whitelist.includes(char) ? encodedValue : char
    })
    .join('')

const getMappedSymbols = (requestParams: RequestParams[]) => {
  const symbolGroupMap: Record<string, { filter_asset_id: string[]; base: string }> = {}
  requestParams.forEach((param) => {
    const base = param.base.toUpperCase()
    const quote = param.quote.toUpperCase()

    if (!symbolGroupMap[base]) {
      symbolGroupMap[base] = {
        base,
        filter_asset_id: [],
      }
    }

    if (!symbolGroupMap[base].filter_asset_id) {
      symbolGroupMap[base].filter_asset_id = [quote]
    } else {
      symbolGroupMap[base].filter_asset_id.push(quote)
    }
  })

  return symbolGroupMap
}

export const buildBatchedRequestBody = (
  requestParams: RequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  const groupedSymbols = getMappedSymbols(requestParams)

  return Object.values(groupedSymbols).map((param) => {
    const url = buildUrlPath('exchangerate/:symbol', { symbol: param.base })
    return {
      params: requestParams.filter((p) => p.base === param.base),
      request: {
        baseURL: config.API_ENDPOINT,
        url,
        params: {
          filter_asset_id: param.filter_asset_id.join(','),
          apikey: config.API_KEY,
        },
      },
    }
  })
}
