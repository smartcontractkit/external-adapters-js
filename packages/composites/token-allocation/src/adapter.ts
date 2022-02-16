import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import {
  DEFAULT_TOKEN_BALANCE,
  DEFAULT_TOKEN_DECIMALS,
  makeConfig,
  makeOptions,
  Source,
} from './config'
import { TokenAllocations, Config, ResponsePayload, GetPrices, TokenAllocation } from './types'
import { Decimal } from 'decimal.js'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import { getPriceProvider } from './dataProvider'
import * as NCFX from '@chainlink/ncfx-adapter'
import * as Finage from '@chainlink/finage-adapter'

Decimal.set({ precision: 100 })

export const priceTotalValue = (
  source: string,
  allocations: TokenAllocations,
  quote: string,
  data: ResponsePayload,
): number => {
  return allocations
    .reduce((acc, t) => {
      const val = data[t.symbol].quote[quote].price
      if (!val)
        throw new Error(
          `ERROR: No price value found for ${t.symbol}/${quote} from the ${source} adapter.`,
        )
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return acc.add(coins.mul(val!))
    }, new Decimal(0))
    .toNumber()
}

export const marketCapTotalValue = (
  source: string,
  allocations: TokenAllocations,
  quote: string,
  data: ResponsePayload,
): number => {
  return allocations
    .reduce((acc, t) => {
      const val = data[t.symbol].quote[quote].marketCap
      if (!val)
        throw new Error(
          `ERROR: No marketcap value found for ${t.symbol}/${quote} from the ${source} adapter.`,
        )
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return acc.add(coins.mul(val!))
    }, new Decimal(0))
    .toNumber()
}

const toValidAllocations = (allocations: TokenAllocation[]) => {
  const _toValidSymbol = (symbol: string) => {
    if (!symbol)
      throw new AdapterError({ message: `Symbol not available for all tokens.`, statusCode: 400 })
    return symbol.toUpperCase()
  }
  const _toValidDecimals = (decimals: number | undefined) => {
    if (decimals === undefined) return DEFAULT_TOKEN_DECIMALS
    return Number.isInteger(decimals) && decimals >= 0 ? decimals : DEFAULT_TOKEN_DECIMALS
  }
  const _toValidBalance = (balance: number | string | undefined, decimals: number) => {
    if (!balance) return DEFAULT_TOKEN_BALANCE * 10 ** decimals
    let BNbalance
    try {
      BNbalance = BigNumber.from(balance.toString())
    } catch (e) {
      throw new AdapterError({ message: `Invalid balance: ${e.message}`, statusCode: 400 })
    }
    if (BNbalance.isNegative())
      throw new AdapterError({ message: `Balance cannot be negative`, statusCode: 400 })
    return balance
  }
  return allocations.map((t) => {
    const decimals = _toValidDecimals(t.decimals)
    return {
      symbol: _toValidSymbol(t.symbol),
      decimals,
      balance: _toValidBalance(t.balance as number, decimals),
    }
  })
}

const computePrice = async (
  source: string,
  getPrices: GetPrices,
  allocations: TokenAllocations,
  quote: string,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const payload = await getPrices(symbols, quote)
  const result = priceTotalValue(source, allocations, quote, payload)
  return { payload, result }
}

const computeMarketCap = async (
  source: string,
  getPrices: GetPrices,
  allocations: TokenAllocations,
  quote: string,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const payload = await getPrices(symbols, quote, true)

  const result = marketCapTotalValue(source, allocations, quote, payload)
  return { payload, result }
}

const inputParams = {
  source: false,
  allocations: true,
  quote: false,
  method: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const paramOptions = makeOptions(config)
  const validator = new Validator(input, inputParams, paramOptions)

  const jobRunID = validator.validated.id
  const { quote = config.defaultQuote, method = config.defaultMethod } = validator.validated.data
  const allocations = toValidAllocations(validator.validated.data.allocations)
  const source: string = (
    validator.validated.data.source ||
    config.defaultSource ||
    ''
  ).toLowerCase()
  if (source === '') {
    throw Error('No source specified in the request or config!')
  }
  validateEndpointSupportedBySource(jobRunID, source, method)

  const sourceConfig = config.sources[source]

  const _success = (payload: ResponsePayload, result: number) =>
    Requester.success(
      jobRunID,
      {
        status: 200,
        data: { sources: [], payload, result },
      },
      true,
    )

  const getPrices = getPriceProvider(source, jobRunID, sourceConfig.api)
  switch (method.toLowerCase()) {
    case 'price': {
      const price = await computePrice(source, getPrices, allocations, quote)
      return _success(price.payload, price.result)
    }
    case 'marketcap': {
      const marketCap = await computeMarketCap(source, getPrices, allocations, quote)
      return _success(marketCap.payload, marketCap.result)
    }
    default:
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

const validateEndpointSupportedBySource = (jobRunID: string, source: Source, method: string) => {
  source = source.toUpperCase()

  // Todo:  In the future we should aim to export the supported endpoints from EAs
  const adaptersNotSupportingMktCap = [NCFX.NAME, Finage.NAME]
  if (method === 'marketcap' && adaptersNotSupportingMktCap.includes(source)) {
    throw new AdapterError({
      jobRunID,
      message: `source ${source} does not support the marketcap endpoint`,
      statusCode: 400,
    })
  }
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
