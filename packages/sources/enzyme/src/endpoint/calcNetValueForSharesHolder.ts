import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import FundValueCalculatorABI from '../abis/FundValueCalculator.json'

export const supportedEndpoints = ['calcNetValueForSharesHolder']

export const description =
  'Endpoint to call the `calcNetValueForSharesHolder` function on the contract.'

export const inputParameters: InputParameters = {
  calculatorContract: {
    required: true,
    type: 'string',
  },
  vaultProxy: {
    required: true,
    type: 'string',
  },
  sharesHolder: {
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const calculatorContractAddress = validator.validated.data.calculatorContract
  const vaultProxyAddress = validator.validated.data.vaultProxy
  const sharesHolderAddress = validator.validated.data.sharesHolder

  const [, netValue] = await calcNetValueForSharesHolder(
    calculatorContractAddress,
    vaultProxyAddress,
    sharesHolderAddress,
    config,
  )

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { netValue: netValue.toString() },
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, netValue.toString()),
    config.verbose,
  )
}

const calcNetValueForSharesHolder = (
  address: string,
  proxy: string,
  sharesHolder: string,
  config: Config,
): Promise<[denominationAsset: string, netValue: BigNumber]> => {
  const contract = new ethers.Contract(address, FundValueCalculatorABI, config.provider)
  return contract.calcNetValueForSharesHolder(proxy, sharesHolder)
}
