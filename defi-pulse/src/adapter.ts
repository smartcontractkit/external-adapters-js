import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import Decimal from 'decimal.js'
import { getSymbol } from './symbols'
import { getAllocations } from './index-allocations'
import { priceAdapter, calculateIndex } from './priceAdapter'

export type AssetIndex = {
  asset: string
  units: Decimal
  weight: number
  priceData?: Record<string, number>
}

type Asset = {
  name: string
  asset: string
  address: string
  adapter: string
  index: AssetIndex[]
}

// Comes from the node
async function getAssetInfo(): Promise<Asset> {
  return {
    name: 'DPI',
    asset: 'DPI',
    address: '0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b',
    adapter: '0xAdapter',
    index: [],
  }
}

async function getIndex(components: string[], units: number[]): Promise<AssetIndex[]> {
  const index = []
  for (let i = 0; i < components.length; i++) {
    const assetIndex: AssetIndex = {
      asset: await getSymbol(components[i]),
      units: new Decimal(units[i]).div(1e18),
      weight: 0,
    }
    index.push(assetIndex)
  }
  return index
}

const execute: Execute = async function (input) {
  const validator = new Validator(input)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const asset = await getAssetInfo()

  const { components, units } = await getAllocations(asset.address)

  const index = await getIndex(components, units)

  const priceIndex = await priceAdapter(index)
  asset.index = priceIndex
  const indexResult = calculateIndex(priceIndex)
  const response = {
    status: 200,
    data: { result: indexResult, ...asset },
  }
  return Requester.success(jobRunID, response)
}

export default execute
