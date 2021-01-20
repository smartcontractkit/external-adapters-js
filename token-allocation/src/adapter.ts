import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, DEFAULT_TOKEN_BALANCE, DEFAULT_TOKEN_DECIMALS, makeConfig } from './config'
import { TokenAllocations, Response } from './types'
import { Decimal } from 'decimal.js'
import { AdapterError } from '@chainlink/external-adapter'

export const calculateTotalValue = (
  allocations: TokenAllocations,
  quote: string,
  data: Response,
): number => {
  return allocations
    .reduce((acc, t) => {
      const price = data[t.symbol].quote[quote].price
      const coins = new Decimal(t.balance.toString(10)).div(10 ** t.decimals)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return acc.add(coins.mul(price!))
    }, new Decimal(0))
    .toNumber()
}

const inputParams = {
  allocations: true,
  quote: false,
}

const toValidAllocations = (allocations: TokenAllocations): TokenAllocations => {
  if (!allocations.every((t) => !!t.symbol))
    throw new AdapterError({ message: `Symbol not available for all tokens.`, statusCode: 400 })
  return allocations.map((t) => ({
    symbol: t.symbol.toUpperCase(),
    decimals: t.decimals || DEFAULT_TOKEN_DECIMALS,
    balance: t.balance || DEFAULT_TOKEN_BALANCE,
  }))
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { quote = 'USD' } = validator.validated.data
  const allocations = toValidAllocations(validator.validated.data.allocations)

  const symbols = (allocations as TokenAllocations).map((t) => t.symbol)
  const prices = await config.priceAdapter.getPrices(symbols, quote)

  const dataResponseEntries = symbols.map((symbol) => {
    const key = symbol
    const val = {
      quote: {
        [quote]: { price: prices[symbol] },
      },
    }
    return [key, val]
  })

  const dataResponse: Response = Object.fromEntries(dataResponseEntries)
  const result = calculateTotalValue(allocations, quote, dataResponse)

  return Requester.success(jobRunID, {
    status: 200,
    data: { allocations: dataResponse, result },
    result,
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
