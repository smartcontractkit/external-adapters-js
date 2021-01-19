import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, makeConfig } from './config'
import { TokenAllocations, TokenAllocation, Response } from './types'
import { Decimal } from 'decimal.js'
import { BigNumber, BigNumberish } from 'ethers/utils'

export const inputParams = {
  allocations: true,
  currency: false,
}

export function parseAllocations(
  allocations: TokenAllocations,
  currency: string,
  defaultBalance: number,
): TokenAllocations {
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

function makeResponse(allocations: TokenAllocations, defaultCurrency: string): Response {
  let response = {}
  allocations.forEach(({ symbol, balance, decimals, currency = defaultCurrency, price }) => {
    const tokenResponse = {
      [symbol]: {
        balance: getNormalizedBalance(balance, decimals).toString(),
        quote: {
          [currency]: {
            price,
          },
        },
      },
    }
    response = { ...response, ...tokenResponse }
  })
  return response
}

export const calculateIndexValue = (index: TokenAllocations): number => {
  // assert all prices are set
  const isPriceSet = (i: TokenAllocation) => i.price && i.price > 0
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

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { allocations, currency = config.defaultCurrency } = validator.validated.data

  const index = await parseAllocations(allocations, currency, config.defaultBalance)
  const priceIndex = await config.priceAdapter.getPriceIndex(index, currency)
  const totalValue = calculateIndexValue(priceIndex)

  const response = makeResponse(priceIndex, currency)
  return Requester.success(jobRunID, {
    status: 200,
    data: { result: totalValue, ...response },
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
