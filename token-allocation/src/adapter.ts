import { AdapterResponse, Execute, AdapterRequest } from '@chainlink/types'
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
  units: false,
  currency: false,
}

export function makeIndex(components: string[], units: any[], currency: string): Index {
  return components.map((component, i) => {
    return {
      asset: component,
      units: new Decimal(new utils.BigNumber(units[i]).toString()),
      currency,
    }
  })
}

export const calculateIndexValue = (index: Index): number => {
  // assert all prices are set
  const isPriceSet = (i: IndexAsset) => i.price && i.price > 0
  if (!index.every(isPriceSet)) throw new Error('Invalid index: price not set')
  // calculate total value
  return index // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .reduce((acc, i) => acc.plus(i.units.div(1e18).times(i.price!)), new Decimal(0))
    .toNumber()
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const {
    components,
    units = config.makeDefaultUnits(components.length),
    currency = config.defaultCurrency,
  } = validator.validated.data

  const index = await makeIndex(components, units, currency)
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
