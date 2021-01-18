import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, makeConfig } from './config'
import { TokenAllocations, PriceAllocation, Response, PriceAllocations } from './types'
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

function makeResponse(allocations: PriceAllocations, defaultQuote: string): Response {
  let response = {}
  allocations.forEach(({ symbol, quote = defaultQuote, price }) => {
    const tokenResponse = {
      [symbol]: {
        quote: {
          [quote]: {
            price,
          },
        },
      },
    }
    response = { ...response, ...tokenResponse }
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
  index: Index,
  currency: string,
): Promise<IndexResult> => {
  const priceIndex = await config.priceAdapter.getPriceIndex(index, currency)
  const total = calculatePriceIndexValue(priceIndex)
  return { total, index: priceIndex }
}

export const calculateMarketcapIndexValue = (index: Index): number => {
  // assert all prices are set
  const isMarketcapSet = (i: IndexAsset) => i.marketcap && i.marketcap > 0
  if (!index.every(isMarketcapSet)) throw new Error('Invalid index: marketcap not set')
  // calculate total value
  return index // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .reduce((acc, i) => acc.plus(i.units.div(1e18).times(i.marketcap!)), new Decimal(0))
    .toNumber()
}

const getMarketcapIndex = async (
  config: Config,
  index: Index,
  currency: string,
): Promise<IndexResult> => {
  const marketcapIndex = await config.priceAdapter.getMarketcap(index, currency)
  const total = calculateMarketcapIndexValue(index)
  return { total, index: marketcapIndex }
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
  switch (method) {
    case 'price':
      const priceIndex = await config.priceAdapter.getPriceIndex(index, quote)
      const totalValue = calculatePriceIndexValue(priceIndex)
      return success(jobRunID, { priceIndex, totalValue })
    case 'marketcap':
      const marketcap = await config.priceAdapter.getMarketcap(index, quote)
      const totalValue = calculateMarketcapIndexValue(marketcap)
      return success(jobRunID, { marketcap, totalValue })
    default:
      throw 'unknown method'
  }
}

const success = (jobRunID: string, data: IndexResult): AdapterResponse => {
  return Requester.success(jobRunID, {
    status: 200,
    data: { result: data.total, index: data.index },
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
