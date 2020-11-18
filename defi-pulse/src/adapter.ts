import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import Decimal from 'decimal.js'
import { priceAdapter, calculateIndex } from './priceAdapter'

/*
  TODOS:
  - What's the address of the adapter contract? How can I get it?
  - What's the initial blob DPI info?
  - Where is the ticker map, associating contracts with symbols?
  - How should I organize this?

*/

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

async function getAssetInfo(): Promise<Asset> {
  // TODO: Is this constant ?
  return {
    name: 'DPI',
    asset: 'DPI',
    address: '0xDPI',
    adapter: '0xAdapter',
    index: [],
  }
}

async function getAllocations(address: string) {
  // TODO: This is a mocked function, it should call the contract instead
  return { components: ['0x123', '0x456'], units: [1100000000000000000, 2320000000000000000] }
}

function getTickerMap(): Record<string, string> {
  // TODO: Some fs read file ?
  return {
    '0x123': 'COMP',
    '0x456': 'UNI',
  }
}

function getTickerSymbol(assetAddress: string): string {
  const tickerMap = getTickerMap()
  if (!tickerMap[assetAddress]) {
    throw new Error('No asset found')
  }
  return tickerMap[assetAddress]
}

function getIndex(components: string[], units: number[]): AssetIndex[] {
  const index = []
  for (let i = 0; i < components.length; i++) {
    const assetIndex: AssetIndex = {
      asset: getTickerSymbol(components[i]),
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

  const index = getIndex(components, units)

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
