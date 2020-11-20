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
  coinId?: string
  priceData?: Record<string, any>
}

type MarketIndex = {
  name: string
  asset: string
  address: string
  adapter: string
  index: Index
}

async function getMarketInfo(): Promise<MarketIndex> {
  return {
    name: 'DPI',
    asset: 'DPI',
    address: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    adapter: '0x78733fa5e70e3ab61dc49d93921b289e4b667093',
    index: [],
  }
}

async function getIndex(components: string[], units: number[]): Promise<IndexAsset[]> {
  const index = []
  for (let i = 0; i < components.length; i++) {
    const indexAsset: IndexAsset = {
      asset: await getSymbol(components[i]),
      units: new Decimal(new utils.BigNumber(units[i]).toString()).div(1e18),
      weight: 0,
    }
    index.push(indexAsset)
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

  try {
    const asset = await getMarketInfo()

    const { components, units } = await getAllocations(asset.adapter, asset.address)

    const index = await getIndex(components, units)

    const priceIndex = await adapter.getPriceIndex(index)
    asset.index = priceIndex
    const indexResult = adapter.calculateIndex(priceIndex)

    const response = {
      status: 200,
      data: { result: indexResult, ...asset },
    }
    return Requester.success(jobRunID, response)
  } catch (e) {
    console.log(e)
  }
}

export default execute
