import {
  AdapterResponse,
  Execute,
  AdapterRequest,
  InputParameters,
  util,
  AdapterInputError,
} from '@chainlink/ea-bootstrap'
import { DEFAULT_TOKEN_BALANCE, DEFAULT_TOKEN_DECIMALS, makeConfig, makeOptions } from '../config'
import { TokenAllocations, Config, ResponsePayload, GetPrices } from '../types'
import { Decimal } from 'decimal.js'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { BigNumber } from 'ethers'
import { getPriceProvider } from '../dataProvider'

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

const toValidAllocations = (allocations: unknown[]): TokenAllocations => {
  const _toValidSymbol = (symbol: unknown) => {
    if (!symbol || typeof symbol !== 'string')
      throw new AdapterError({ message: `Symbol not available for all tokens.`, statusCode: 400 })
    return symbol.toUpperCase()
  }
  const _toValidDecimals = (decimals: unknown): number => {
    if (decimals === undefined) return DEFAULT_TOKEN_DECIMALS
    return !isNaN(Number(decimals)) && Number(decimals) >= 0
      ? (decimals as number)
      : DEFAULT_TOKEN_DECIMALS
  }
  const _toValidBalance = (balance: unknown, decimals: number): number | string => {
    if (!balance) return DEFAULT_TOKEN_BALANCE * 10 ** decimals
    let BNbalance
    try {
      BNbalance = BigNumber.from((balance as any).toString())
    } catch (e: any) {
      const error = e as Error
      throw new AdapterError({ message: `Invalid balance: ${error.message}`, statusCode: 400 })
    }
    if (BNbalance.isNegative())
      throw new AdapterError({ message: `Balance cannot be negative`, statusCode: 400 })
    return balance as number | string
  }
  return allocations.map((t: unknown) => {
    if (!util.isObject(t))
      throw new AdapterError({ message: `Invalid allocations`, statusCode: 400 })
    const aObj = t as Record<string, unknown>

    const decimals = _toValidDecimals(aObj.decimals)
    return {
      symbol: _toValidSymbol(aObj.symbol),
      decimals,
      balance: _toValidBalance(aObj.balance, decimals),
    }
  })
}

const computePrice = async (
  source: string,
  getPrices: GetPrices,
  allocations: TokenAllocations,
  quote: string,
  additionalInput: Record<string, unknown>,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const uniqueSymbols = Array.from(new Set(symbols))
  const payload = await getPrices(uniqueSymbols, quote, additionalInput, false)
  const result = priceTotalValue(source, allocations, quote, payload)
  return { payload, result }
}

const computeMarketCap = async (
  source: string,
  getPrices: GetPrices,
  allocations: TokenAllocations,
  quote: string,
  additionalInput: Record<string, unknown>,
) => {
  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const payload = await getPrices(symbols, quote, additionalInput, true)

  const result = marketCapTotalValue(source, allocations, quote, payload)
  return { payload, result }
}

export type TInputParameters = {
  source: string
  allocations: TokenAllocations
  quote: string
  method: string
}
export const inputParameters: InputParameters<TInputParameters> = {
  source: false,
  allocations: true,
  quote: false,
  method: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  if (input.data) {
    input.data.source = (input.data.source as string)?.replace('-', '_') || ''
  }

  const paramOptions = makeOptions(config)
  const validator = new Validator(input, inputParameters, paramOptions)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const {
    quote = config.defaultQuote,
    method = config.defaultMethod,
    allocations,
    source = config.defaultSource || '',
    ...additionalInput
  } = validator.validated.data
  const startingAllocations = toValidAllocations(allocations)

  if (source === '') {
    throw Error('No source specified in the request or config!')
  }

  const sourceConfig = config.sources[source.toLowerCase()]

  const _success = (payload: ResponsePayload, result: number) =>
    Requester.success(
      jobRunID,
      {
        status: 200,
        data: { sources: [], payload, result },
      },
      true,
    )

  const getPrices = getPriceProvider(source.toLowerCase(), jobRunID, sourceConfig.api)
  switch (method.toLowerCase()) {
    case 'price': {
      const price = await computePrice(
        source.toLowerCase(),
        getPrices,
        startingAllocations,
        quote,
        additionalInput as Record<string, unknown>,
      )
      return _success(price.payload, price.result)
    }
    case 'marketcap': {
      const marketCap = await computeMarketCap(
        source.toLowerCase(),
        getPrices,
        startingAllocations,
        quote,
        additionalInput as Record<string, unknown>,
      )
      return _success(marketCap.payload, marketCap.result)
    }
    default:
      throw new AdapterInputError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
