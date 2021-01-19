import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, makeConfig } from './config'
import {
  TokenAllocations,
  PriceAllocation,
  Response,
  PriceAllocations,
  TotalCalculation,
} from './types'
import { Decimal } from 'decimal.js'
import { BigNumber, BigNumberish } from 'ethers/utils'

export const inputParams = {
  allocations: true,
  quote: false,
}

export function parseAllocations(
  allocations: TokenAllocations,
  currency: string,
  defaultBalance: number,
): PriceAllocations {
  return allocations.map(({ symbol, balance = defaultBalance, decimals = 18 }) => {
    return {
      symbol,
      currency,
      balance: new BigNumber(balance.toString()),
      decimals,
    }
  })
}

function getNormalizedBalance(balance: BigNumberish, decimals: number): Decimal {
  return new Decimal(balance.toString()).div(Math.pow(10, decimals))
}

function makeResponse(
  allocations: PriceAllocations,
  totalCalc: TotalCalculation,
  defaultQuote: string,
): Response {
  const response: Response = {
    result: totalCalc(allocations),
    allocations: {},
  }
  allocations.forEach(({ symbol, quote = defaultQuote, price, marketcap }) => {
    const tokenResponse = {
      [symbol]: {
        quote: {
          [quote]: {
            price,
            marketcap,
          },
        },
      },
    }
    response.allocations = { ...response.allocations, ...tokenResponse }
  })
  return response
}

export const calculatePriceIndexValue = (index: PriceAllocations): number => {
  // assert all prices are set
  const isPriceSet = (i: PriceAllocation) => i.price && i.price > 0
  if (!index.every(isPriceSet)) throw new Error('Invalid index: price not set')
  // calculate total value
  return index
    .reduce(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (acc, i) => acc.add(getNormalizedBalance(i.balance, i.decimals).mul(i.price!)),
      new Decimal(0),
    )
    .toNumber()
}

const getPriceIndex = async (
  config: Config,
  allocations: PriceAllocations,
  quote: string,
): Promise<Response> => {
  const priceIndex = await config.priceAdapter.getPriceIndex(allocations, quote)
  return makeResponse(priceIndex, calculatePriceIndexValue, quote)
}

export const calculateMarketcapIndexValue = (index: PriceAllocations): number => {
  // assert all prices are set
  const isMarketcapSet = (i: PriceAllocation) => i.marketcap && i.marketcap > 0
  if (!index.every(isMarketcapSet)) throw new Error('Invalid index: marketcap not set')
  // calculate total value
  return index
    .reduce(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (acc, i) => acc.add(getNormalizedBalance(i.balance, i.decimals).mul(i.marketcap!)),
      new Decimal(0),
    )
    .toNumber()
}

const getMarketcapIndex = async (
  config: Config,
  allocations: PriceAllocations,
  quote: string,
): Promise<Response> => {
  const marketcapIndex = await config.priceAdapter.getMarketcap(allocations, quote)
  return makeResponse(marketcapIndex, calculateMarketcapIndexValue, quote)
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const {
    allocations,
    quote = config.defaultQuote,
    method = config.defaultMethod,
  } = validator.validated.data

  const index = await parseAllocations(allocations, quote, config.defaultBalance)
  let indexFunction: (
    config: Config,
    allocations: PriceAllocations,
    quote: string,
  ) => Promise<Response>
  switch (method) {
    case 'price':
      indexFunction = getPriceIndex
      break
    case 'marketcap':
      indexFunction = getMarketcapIndex
      break
    default:
      throw 'unknown method'
  }

  return success(jobRunID, await indexFunction(config, index, quote))
}

const success = (jobRunID: string, data: Response): AdapterResponse => {
  return Requester.success(jobRunID, {
    status: 200,
    data,
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
