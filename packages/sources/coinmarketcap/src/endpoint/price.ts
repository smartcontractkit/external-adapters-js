import { Requester, Validator } from '@chainlink/external-adapter'
import { NAME as AdapterName } from '../config'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

export const NAME = 'price'

// Coin IDs fetched from the ID map: https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyMap
const presetIds: { [symbol: string]: number } = {
  COMP: 5692,
  BNT: 1727,
  RCN: 2096,
  UNI: 7083,
  CRV: 6538,
  FNX: 5712,
  ETC: 1321,
  BAT: 1697,
  CRO: 3635,
  LEO: 3957,
  FTT: 4195,
  HT: 2502,
  OKB: 3897,
  KCS: 2087,
  BTC: 1,
  ETH: 1027,
  BNB: 1839,
  LINK: 1975,
  BCH: 1831,
  MKR: 1518,
  AAVE: 7278,
  UMA: 5617,
  SNX: 2586,
  REN: 2539,
  KNC: 1982,
  SUSHI: 6758,
  YFI: 5864,
  BAL: 5728,
  '1INCH': 8104,
}

const priceParams = {
  base: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  cid: false,
  slug: false,
}

interface Prices {
  [symbol: string]: { price: number; marketCap: number }
}

const getPayload = (prices: Prices, quote: string) => {
  const payloadEntries = Object.entries(prices).map(([symbol, info]) => {
    const val = {
      quote: {
        [quote]: { price: info.price, marketCap: info.marketCap },
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

  const symbol = validator.overrideSymbol(AdapterName)
  const assets = Array.isArray(symbol) ? symbol : [symbol]
  // CMC allows a coin name to be specified instead of a symbol
  const slug = validator.validated.data.slug
  // CMC allows a coin ID to be specified instead of a symbol
  const cid = validator.validated.data.cid
  // Free CMCPro API only supports a single symbol to convert
  const convert = validator.validated.data.convert

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

  const _success = (prices: Prices, response: any) => {
    const payload = getPayload(prices, convert)
    const result = Object.values(prices).length === 1 && Object.values(prices)[0].price
    return Requester.success(jobRunID, {
      data: config.verbose ? { ...response, result, payload } : { result, payload },
      result,
      status: 200,
    })
  }

  const params: Record<string, string> = { convert }
  const _validatePrice = (data: any) =>
    Requester.validateResultNumber(data, ['quote', convert, 'price'])
  const _validateMarketCap = (data: any) =>
    Requester.getResult(data, ['quote', convert, 'market_cap'])
  if (cid) {
    const response = await _getPriceData({ ...params, id: cid })
    const prices = {
      [response[cid].symbol]: {
        price: _validatePrice(response[cid]),
        marketCap: _validateMarketCap(response[cid]),
      },
    }
    return _success(prices, response)
  } else if (slug) {
    const response = await _getPriceData({ ...params, slug })
    const asset: any = Object.values(response).find(
      (o: any) => o.slug.toLowerCase() === slug.toLowerCase(),
    )
    return _success(
      {
        [asset.symbol]: {
          price: _validatePrice(response[cid]),
          marketCap: _validateMarketCap(response[cid]),
        },
      },
      response,
    )
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
    const prices = Object.fromEntries(
      assets.map((symbol) => [
        symbol,
        {
          price: _validatePrice(response[cid]),
          marketCap: _validateMarketCap(response[cid]),
        },
      ]),
    )
    return _success(prices, response)
  }
}
