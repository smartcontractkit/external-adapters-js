import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import FundValueCalculatorABI from '../abis/FundValueCalculator.json'

export const supportedEndpoints = ['calcGav']

export const inputParameters: InputParameters = {
  calculatorContract: true,
  vaultProxy: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const calculatorContractAddress = validator.validated.data.calculatorContract
  const vaultProxyAddress = validator.validated.data.vaultProxy

  const [, gav] = await calcGav(calculatorContractAddress, vaultProxyAddress, config)

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { gav: gav.toString() },
  }
  return Requester.success(jobRunID, Requester.withResult(response, gav.toString()), config.verbose)
}

const calcGav = (
  address: string,
  proxy: string,
  config: Config,
): Promise<[denominationAsset: string, gav: BigNumber]> => {
  const contract = new ethers.Contract(address, FundValueCalculatorABI, config.provider)
  return contract.calcGav(proxy)
}
