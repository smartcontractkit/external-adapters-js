import { Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { BigNumber, ethers } from 'ethers'
import FundValueCalculatorABI from '../abis/FundValueCalculator.json'

export const supportedEndpoints = ['calcNetShareValueInAsset']

export const description =
  'Endpoint to call the `calcNetShareValueInAsset` function on the contract.'

export type TInputParameters = {
  calculatorContract: string
  vaultProxy: string
  quoteAsset: string
}

export const inputParameters: InputParameters<TInputParameters> = {
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

  let netShareValue
  try {
    netShareValue = await calcNetShareValueInAsset(
      calculatorContractAddress,
      vaultProxyAddress,
      quoteAsset,
      config,
    )
  } catch (e) {
    throw new AdapterDataProviderError({
      network: 'ethereum',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

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
