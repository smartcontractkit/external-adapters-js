import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import Decimal from 'decimal.js'
import { utils } from 'ethers'
import { Config, makeConfig } from './config'

export type Index = IndexAsset[]

type IndexAsset = {
  asset: string
  units: Decimal
  price?: number
  currency: string
}

// Components is an array of token symbols
export const inputParams = {
  components: true,
  units: true,
  currency: false,
}

export function makeIndex(components: string[], units: any[], currency: string): Index {
  return components.map((component, i) => {
    return {
      asset: component,
      units: new Decimal(new utils.BigNumber(units[i]).toString()).div(1e18),
      currency,
    }
  })
}

export const calculateIndexValue = (index: Index): number => {
  // assert all prices are set
  const isPriceSet = (i: IndexAsset) => i.price && i.price > 0
  if (!index.every(isPriceSet)) throw new Error('Invalid index: price not set')
  // calculate total value
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return index.reduce((acc, i) => acc.plus(i.units.times(i.price!)), new Decimal(0)).toNumber()
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { components, units, currency = config.defaultCurrency } = validator.validated.data

  const index = await makeIndex(components, units, currency)
  const priceIndex = await config.priceAdapter.getPriceIndex(index, currency)
  const totalValue = calculateIndexValue(priceIndex)

  return Requester.success(jobRunID, {
    status: 200,
    data: { result: totalValue, index: priceIndex },
  })
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => (input) =>
  execute(input, config || makeConfig())
