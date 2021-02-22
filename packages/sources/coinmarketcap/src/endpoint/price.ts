import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

export const NAME = 'price'
export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

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
  KCS: 'kucoin-token',
}

const priceParams = {
  symbol: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
  slug: false,
  path: false,
}

const getPayload = (prices: { [symbol: string]: number }, quote: string) => {
  const payloadEntries = Object.entries(prices).map(([symbol, price]) => {
    const val = {
      quote: {
        [quote]: { price },
      },
    }
    return [symbol, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return payload
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const assets = Array.isArray(symbol) ? symbol : [symbol]
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert
  const path = validator.validated.data.path || Paths.Price

  const _getPriceData = async (params: any): Promise<any> => {
    const url = 'cryptocurrency/quotes/latest'
    const options = {
      ...config.api,
      url,
      params,
    }
    const response = await Requester.request(options)
    console.log(response.data.data)
    return response.data && response.data.data
  }

  const _success = (prices: any, response: any) => {
    const payload = getPayload(prices, convert)
    const result = Object.values(prices).length === 1 && Object.values(prices)[0]
    return Requester.success(jobRunID, {
      data: config.verbose ? { ...response, result, payload } : { result, payload },
      result,
      status: 200,
    })
  }

  const params: Record<string, string> = { convert }
  const _validate = (data: any) => Requester.validateResultNumber(data, ['quote', convert, 'price'])
  if (cid) {
    const response = await _getPriceData({ ...params, id: cid })
    const prices = { [response[cid].symbol]: _validate(response[cid]) }
    return _success(prices, response)
  } else if (slug) {
    const response = await _getPriceData({ ...params, slug })
    const asset: any = Object.values(response).find(
      (o: any) => o.slug.toLowerCase() === slug.toLowerCase(),
    )
    return _success({ [asset.symbol]: _validate(asset) }, response)
  } else {
    const slugs = assets.map((s) => presetSlugs[s]).filter(Boolean)
    const symbols = assets.filter((s) => !presetSlugs[s])
    let response: Record<string, any> = {}
    // Queries for slugs and symbols cannot be together
    if (slugs.length > 0) {
      const slugPrices = await _getPriceData({ ...params, slug: slugs.join() })
      response = { ...response, ...slugPrices }
    }

    if (symbols.length > 0) {
      const symbolPrices = await _getPriceData({ ...params, symbol: symbols.join() })
      response = { ...response, ...symbolPrices }
    }

    const indexMap = new Map()
    Object.values(response).forEach((asset) => indexMap.set(asset.symbol.toUpperCase(), asset))
    console.log(indexMap)
    const prices = Object.fromEntries(
      assets.map((symbol) => [symbol, _validate(indexMap.get(symbol.toUpperCase()))]),
    )
    return _success(prices, response)
  }
}
