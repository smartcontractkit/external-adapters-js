import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { utils } from 'ethers'
import { getSymbol } from './symbols'
import { getAllocations } from './index-allocations'
import { getPriceAdapter, PriceAdapter } from './priceAdapter'
import Decimal from 'decimal.js'

export type Index = IndexAsset[]

export type IndexAsset = {
  asset: string
  units: Decimal
  price?: number
}

async function makeIndex(
  components: string[],
  units: number[],
  network: string,
  rpcUrl: string,
): Promise<Index> {
  return await Promise.all(
    components.map(async (component, i) => {
      return {
        asset: await getSymbol(component, network, rpcUrl),
        units: new Decimal(new utils.BigNumber(units[i]).toString()).div(1e18),
      }
    }),
  )
}

const calculateIndexValue = (index: Index): number =>
  index
    .reduce((acc, { units, price }) => {
      if (!price) throw new Error('Invalid price')
      return acc.plus(units.times(price))
    }, new Decimal(0))
    .toNumber()

export const execute: Execute = async (input) => {
  const dataProvider = util.getRequiredEnv('DATA_PROVIDER')
  const priceAdapter = getPriceAdapter(dataProvider)
  return await executeWithAdapters(input, priceAdapter)
}

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
}

const executeWithAdapters: Execute = async function (input, adapter: PriceAdapter) {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const { components, units } = await getAllocations(asset.adapter, asset.address, rpcUrl)

  const index = await makeIndex(components, units, 'mainnet', rpcUrl)

  const priceIndex = await adapter.getPriceIndex(index, 'USD')
  const totalValue = calculateIndexValue(priceIndex)

  const response = {
    status: 200,
    data: { ...input.data, result: totalValue, index: priceIndex },
  }
  return Requester.success(jobRunID, response)
}

export default execute
