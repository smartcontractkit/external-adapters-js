import { util } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Execute } from '@chainlink/types'
import Decimal from 'decimal.js'
import { utils } from 'ethers'
import { getPriceAdapter, PriceAdapter } from './priceAdapter'

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

function makeIndex(components: string[], units: number[], currency: string): Index {
  return components.map((component, i) => {
    return {
      asset: component,
      units: new Decimal(new utils.BigNumber(units[i]).toString()).div(1e18),
      currency,
    }
  })
}

const calculateIndexValue = (index: Index): number => {
  // assert all prices are set
  const isPriceSet = (i: IndexAsset) => i.price && i.price > 0
  if (!index.every(isPriceSet)) throw new Error('Invalid index: price not set')
  // calculate total value
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return index.reduce((acc, i) => acc.plus(i.units.times(i.price!)), new Decimal(0)).toNumber()
}

export const execute: Execute = async (input) => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER')
  const priceAdapter = getPriceAdapter(dataProvider)
  return await executeWithAdapters(input, priceAdapter)
}

const executeWithAdapters = async function (input: AdapterRequest, adapter: PriceAdapter) {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  try {
    const jobRunID = validator.validated.id
    const { components, units, currency = 'USD' } = validator.validated.data

    const index = await makeIndex(components, units, currency)
    const priceIndex = await adapter.getPriceIndex(index, currency)
    const totalValue = calculateIndexValue(priceIndex)

    return Requester.success(jobRunID, {
      status: 200,
      data: { result: totalValue, index: priceIndex },
    })
  } catch (e) {
    console.log(e)
  }
}
