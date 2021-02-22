import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

export const NAME = 'price'
export enum Paths {
  Price = 'price',
  MarketCap = 'marketcap',
}

// Defaults we use when there are multiple currencies with the same symbol
export const presetSlugs: Record<string, string> = {
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

interface AssetResponse {
  assets: { [key: string]: any }
  response: any
}

export const getSymbolData = async (
  config: Config,
  base: { [key: string]: any },
  quote: string,
): Promise<AssetResponse> => {
  const _getPriceData = async (params: any): Promise<any> => {
    const url = 'cryptocurrency/quotes/latest'
    const options = {
      ...config.api,
      url,
      params,
    }
    const response = await Requester.request(options)
    return response.data && response.data.data
  }

  const params = { convert: quote }
  const cid = base.cid
  const slug = base.slug
  const assets: string[] = base.assets
  if (cid) {
    const response = await _getPriceData({ ...params, id: cid })
    return {
      assets: { [response[cid].symbol]: response[cid] },
      response,
    }
  } else if (slug) {
    const response = await _getPriceData({ ...params, slug })
    const asset: any = Object.values(response).find(
      (o: any) => o.slug.toLowerCase() === slug.toLowerCase(),
    )
    return {
      assets: { [asset.symbol]: asset },
      response,
    }
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
    return {
      assets: Object.fromEntries(
        assets.map((symbol: any) => [symbol, indexMap.get(symbol.toUpperCase())]),
      ),
      response,
    }
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, priceParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const assets = Array.isArray(symbol) ? symbol : [symbol]
  const slug = validator.validated.data.slug
  const cid = validator.validated.data.cid
  const convert = validator.validated.data.convert

  const _validatePrice = (data: any) =>
    Requester.validateResultNumber(data, ['quote', convert, 'price'])

  const response = await getSymbolData(config, { cid, slug, assets }, convert)
  const result =
    Object.values(response.assets).length === 1 && _validatePrice(Object.values(response.assets)[0])

  const payloadEntries = Object.entries(response.assets).map(([symbol, price]) => {
    const val = {
      quote: {
        [convert]: { price: _validatePrice(price) },
      },
    }
    return [symbol, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
