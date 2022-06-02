import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { BigNumber, ethers } from 'ethers'
import FundValueCalculatorABI from '../abis/FundValueCalculator.json'

export const supportedEndpoints = ['calcNetShareValueInAsset']

export const description =
  'Endpoint to call the `calcNetShareValueInAsset` function on the contract.'

export const inputParameters: InputParameters = {
  calculatorContract: {
    required: true,
    type: 'string',
  },
  vaultProxy: {
    required: true,
    type: 'string',
  },
  quoteAsset: {
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const calculatorContractAddress = validator.validated.data.calculatorContract
  const vaultProxyAddress = validator.validated.data.vaultProxy
  const quoteAsset = validator.validated.data.quoteAsset

  const netShareValue = await calcNetShareValueInAsset(
    calculatorContractAddress,
    vaultProxyAddress,
    quoteAsset,
    config,
  )

  const response = {
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: { netShareValue: netShareValue.toString() },
  }
  return Requester.success(
    jobRunID,
    Requester.withResult(response, netShareValue.toString()),
    config.verbose,
  )
}

const calcNetShareValueInAsset = (
  address: string,
  proxy: string,
  quoteAsset: string,
  config: Config,
): Promise<BigNumber> => {
  const contract = new ethers.Contract(address, FundValueCalculatorABI, config.provider)
  return contract.calcNetShareValueInAsset(proxy, quoteAsset)
}
