import { Requester, Validator } from '@chainlink/external-adapter'
import { Execute } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import TokenAllocation from '@chainlink/token-allocation-adapter'
import { getAllocations } from './index-allocations'
import Decimal from 'decimal.js'

export type Index = IndexAsset[]

export type IndexAsset = {
  asset: string
  units: Decimal
  price?: number
}

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const { components, units } = await getAllocations(
    asset.adapter,
    asset.address,
    rpcUrl,
    'mainnet',
  )

  const result = await TokenAllocation.execute({
    data: { ...input.data, components, units },
  })

  const response = {
    status: 200,
    data: { ...input.data, ...result },
  }
  return Requester.success(jobRunID, response)
}

export default execute
