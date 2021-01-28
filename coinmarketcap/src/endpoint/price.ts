import { util } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'price'

// Defaults we use when there are multiple currencies with the same symbol
const presetSlugs: Record<string, string> = {
  COMP: 'compound',
  BNT: 'bancor',
  RCN: 'ripio-credit-network',
  UNI: 'uniswap',
  CRV: 'curve-dao-token',
  FNX: 'finnexus',
  ETC: 'ethereum-classic',
  BAT: 'basic-attention-token',
  CRO: 'crypto-com-coin',
  LEO: 'unus-sed-leo',
  FTT: 'ftx-token',
  HT: 'huobi-token',
  OKB: 'okb',
  KCS: 'kucoin-shares',
}

const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
  slug: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const url = 'cryptocurrency/quotes/latest'
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const symbol = validator.validated.data.symbol
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid || ''
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert

  const params: Record<string, string> = { convert }
  if (cid) {
    params.id = cid
  } else if (slug) {
    params.slug = slug
  } else {
    const slugForSymbol = presetSlugs[symbol]
    if (slugForSymbol) {
      params.slug = slugForSymbol
    } else {
      params.symbol = symbol
    }
  }

  const options = {
    ...config.api,
    url,
    headers: {
      'X-CMC_PRO_API_KEY': util.getRandomRequiredEnv('API_KEY'),
    },
    params,
  }
  const response = await Requester.request(options)

  // CMC API currently uses ID as key in response, when querying with "slug" param
  const _keyForSlug = (data: any, slug: string) => {
    if (!data || !data.data) return
    // First try to find slug key in response (in case the API starts returning keys correctly)
    if (Object.keys(data.data).includes(slug)) return slug
    // Fallback to ID
    const _iEqual = (s1: string, s2: string) => s1.toUpperCase() === s2.toUpperCase()
    const o: any = Object.values(data.data).find((o: any) => _iEqual(o.slug, slug))
    return o && o.id
  }

  const key = params.id || _keyForSlug(response.data, params.slug || '') || params.symbol
  const path = ['data', key, 'quote', convert, 'price']

  const result = Requester.validateResultNumber(response.data, path)

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
