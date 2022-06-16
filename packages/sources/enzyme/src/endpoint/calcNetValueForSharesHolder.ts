import { Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { ethers, BigNumber } from 'ethers'
import FundValueCalculatorABI from '../abis/FundValueCalculator.json'

export const supportedEndpoints = ['calcNetValueForSharesHolder']

export const description =
  'Endpoint to call the `calcNetValueForSharesHolder` function on the contract.'

export type TInputParameters = {
  calculatorContract: string
  vaultProxy: string
  sharesHolder: string
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

  let netValue
  try {
    ;[, netValue] = await calcNetValueForSharesHolder(
      calculatorContractAddress,
      vaultProxyAddress,
      sharesHolderAddress,
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
