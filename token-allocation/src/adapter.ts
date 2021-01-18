import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, makeConfig } from './config'
import { Allocations } from './types'
import { Decimal } from 'decimal.js'

export type Index = IndexAsset[]

type IndexAsset = {
  asset: string
  price?: number
  currency: string
  units: Decimal
}

// Components is an array of token symbols
export const inputParams = {
  allocations: true,
  currency: false,
}

export function makeIndex(
  allocations: Allocations,
  currency: string,
  defaultBalance: number,
): Index {
  return allocations.map(({ symbol, balance = defaultBalance, decimals = 18 }) => {
    return {
      asset: symbol,
      currency,
      units: new Decimal(balance).div(Math.pow(10, decimals)),
    }
  })
}

export const calculateIndexValue = (index: Index): number => {
  // assert all prices are set
  const isPriceSet = (i: IndexAsset) => i.price && i.price > 0
  if (!index.every(isPriceSet)) throw new Error('Invalid index: price not set')
  // calculate total value
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return index.reduce((acc, i) => acc.add(i.units.times(i.price!)), new Decimal(0)).toNumber()
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { allocations, currency = config.defaultCurrency } = validator.validated.data

  const index = await makeIndex(allocations, currency, config.defaultBalance)
  const priceIndex = await config.priceAdapter.getPriceIndex(index, currency)
  const totalValue = calculateIndexValue(priceIndex)

  return Requester.success(jobRunID, {
    status: 200,
    data: { result: totalValue, index: priceIndex },
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
