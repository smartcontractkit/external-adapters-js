import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import CollateralManagerV1ABI from '../abis/CollateralManagerV1.json'

export const supportedEndpoints = ['getReserveValue']

export const inputParameters: InputParameters = {
  address: true,
  reserveId: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const reserveId = validator.validated.data.reserveId

  const result = await getReserveValue(address, reserveId, config)

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { value: result.toString() },
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result.toString()),
    config.verbose,
  )
}

const getReserveValue = (
  address: string,
  reserveId: string,
  config: Config,
): Promise<[denominationAsset: string, netValue: BigNumber]> => {
  const contract = new ethers.Contract(address, CollateralManagerV1ABI, config.provider)
  return contract.callStatic.getReserveValue(reserveId)
}
