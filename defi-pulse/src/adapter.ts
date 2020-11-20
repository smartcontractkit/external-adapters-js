import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import Decimal from 'decimal.js'
import { getSymbol } from './symbols'
import { getAllocations } from './index-allocations'
import { getPriceAdapter } from './priceAdapter'

export type Index = IndexAsset[]

export type IndexAsset = {
  asset: string
  units: Decimal
  weight: number
  priceData?: Record<string, number>
}

type MarketIndex = {
  name: string
  asset: string
  address: string
  adapter: string
  index: Index
}
// Comes from the node
async function getAssetInfo(): Promise<MarketIndex> {
  return {
    name: 'DPI',
    asset: 'DPI',
    address: '0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b',
    adapter: '0xAdapter',
    index: [],
  }
}

async function getIndex(components: string[], units: number[]): Promise<IndexAsset[]> {
  const index = []
  for (let i = 0; i < components.length; i++) {
    const IndexAsset: IndexAsset = {
      asset: await getSymbol(components[i]),
      units: new Decimal(units[i]).div(1e18),
      weight: 0,
    }
    index.push(IndexAsset)
  }
  return index
}

export const execute: Execute = async (input) => {
  const priceAdapter = getPriceAdapter()
  return await executeWithAdapters(input, priceAdapter)
}

const executeWithAdapters: Execute = async function (input, adapter) {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const asset = await getAssetInfo()

  const { components, units } = await getAllocations(asset.address)

  const index = await getIndex(components, units)

  const priceIndex = await adapter.getPriceIndex(index)
  asset.index = priceIndex
  const indexResult = adapter.calculateIndex(priceIndex)

  const response = {
    data: { result: indexResult, ...asset },
  }
  return Requester.success(jobRunID, response)
}

export default execute
