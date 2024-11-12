import { Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  InputParameters,
  AdapterResponse,
} from '@chainlink/ea-bootstrap'
import { FANTOM_AGGREGATOR_PROXY, SFTMX_RATE_PROVIDER } from '../config'
import rateProviderAbi from '../abi/sFTMxRateProvider.json'
import fantomAggregatorAbi from '../abi/FantomAggregator.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['sftmx']

export const description = 'sFTMx token price in USD.'

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (
  request,
  _,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(
    config.adapterSpecificParams?.fantomRpcUrl.toString(),
    config.adapterSpecificParams?.fantomChainId,
  )

  const rateProvider = new ethers.Contract(SFTMX_RATE_PROVIDER, rateProviderAbi, provider)
  const fantomPrice = new ethers.Contract(FANTOM_AGGREGATOR_PROXY, fantomAggregatorAbi, provider)

  let values
  try {
    values = await Promise.all([rateProvider.getExchangeRate(), fantomPrice.latestAnswer()])
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network: 'fantom',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const [rate, fantomUSD] = values
  const result = fantomUSD.mul(rate).div(ethers.utils.parseUnits('1', 18)).toNumber()

  const response = {
    status: 200,
    statusText: 'OK',
    data: { result },
    headers: {},
    config: {},
  }

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
