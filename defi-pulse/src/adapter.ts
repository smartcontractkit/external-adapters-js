import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import { utils } from 'ethers'
import { getSymbol } from './symbols'
import { getAllocations } from './index-allocations'
import { getPriceAdapter } from './priceAdapter'
import Decimal from 'decimal.js'

export type Index = IndexAsset[]

export type IndexAsset = {
  asset: string
  units: Decimal
  weight: number
  price: number
}

async function getIndex(components: string[], units: number[]): Promise<Index> {
  const index = []
  for (let i = 0; i < components.length; i++) {
    const indexAsset: IndexAsset = {
      asset: await getSymbol(components[i]),
      units: new Decimal(new utils.BigNumber(units[i]).toString()).div(1e18),
      weight: 0,
      price: 0,
    }
    index.push(indexAsset)
  }
  return index
}

const calculateIndex = (index: Index): number =>
  index
    .reduce(
      (acc, { units, price }) => acc.plus(new Decimal(units).times(new Decimal(price))),
      new Decimal(0),
    )
    .toNumber()

export const execute: Execute = async (input) => {
  const priceAdapter = getPriceAdapter()
  return await executeWithAdapters(input, priceAdapter)
}

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
}

const executeWithAdapters: Execute = async function (input, adapter) {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  const { components, units } = await getAllocations(asset.adapter, asset.address)

  const index = await getIndex(components, units)

  const priceIndex = await adapter.getPriceIndex(index)
  asset.index = priceIndex
  const indexResult = calculateIndex(priceIndex)

  const response = {
    status: 200,
    data: { result: indexResult, ...asset },
  }
  return Requester.success(jobRunID, response)
}

export default execute
