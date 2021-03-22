import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { DEFAULT_TOKEN_BALANCE, DEFAULT_TOKEN_DECIMALS, makeConfig, makeOptions } from './config'
import { TokenAllocations, Config, ResponsePayload, PriceAdapter } from './types'
import { Decimal } from 'decimal.js'
import { AdapterError } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'

export const priceTotalValue = (
  allocations: TokenAllocations,
  quote: string,
  data: ResponsePayload,
): number => {
  return allocations
    .reduce((acc, t) => {
      const val = data[t.symbol].quote[quote].price
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return acc.add(coins.mul(val!))
    }, new Decimal(0))
    .toNumber()
}

export const marketCapTotalValue = (
  allocations: TokenAllocations,
  quote: string,
  data: ResponsePayload,
): number => {
  return allocations
    .reduce((acc, t) => {
      const val = data[t.symbol].quote[quote].marketCap
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return acc.add(coins.mul(val!))
    }, new Decimal(0))
    .toNumber()
}

const toValidAllocations = (allocations: any[]): TokenAllocations => {
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
  return allocations.map((t: any) => {
    const decimals = _toValidDecimals(t.decimals)
    return {
      symbol: _toValidSymbol(t.symbol),
      decimals,
      balance: _toValidBalance(t.balance, decimals),
    }
  })
}

const computePrice = async (
  jobRunID: string,
  config: Config,
  allocations: TokenAllocations,
  quote: string,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const payload = await sourceConfig.getPrices(symbols, quote)

  const result = priceTotalValue(allocations, quote, payload)
  return { payload, result }
}

const computeMarketCap = async (
  jobRunID: string,
  config: Config,
  allocations: TokenAllocations,
  quote: string,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const payload = await sourceConfig.getPrices(symbols, quote, true)

  const result = marketCapTotalValue(allocations, quote, payload)
  return { payload, result }
}

const inputParams = {
  source: true,
  allocations: true,
  quote: false,
  method: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const paramOptions = makeOptions(config)
  const validator = new Validator(input, inputParams, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { quote = config.defaultQuote, method = config.defaultMethod } = validator.validated.data
  const allocations = toValidAllocations(validator.validated.data.allocations)
  const source: string = validator.validated.data.source.toLowerCase()
  const sourceConfig = config.sources[source]

  const _success = (payload: ResponsePayload, result: number) =>
    Requester.success(jobRunID, {
      status: 200,
      data: { sources: [], payload, result },
    })

  switch (method.toLowerCase()) {
    case 'price':
      // eslint-disable-next-line no-case-declarations
      const price = await computePrice(sourceConfig, allocations, quote)
      return _success(price.payload, price.result)
    case 'marketcap':
      // eslint-disable-next-line no-case-declarations
      const marketCap = await computeMarketCap(sourceConfig, allocations, quote)
      return _success(marketCap.payload, marketCap.result)
    default:
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
