import { Requester, Validator, AdapterDataProviderError, util } from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  InputParameters,
  AdapterResponse,
} from '@chainlink/ea-bootstrap'
import { BSC_AGGREGATOR_PROXY, BNBX_RATE_PROVIDER, BNBX_RATE_MULTIPLIER } from '../config'
import rateProviderAbi from '../abi/BNBxRateProvider.json'
import bnbAggregatorAbi from '../abi/BSCAggregator.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['bnbx']

export const description = 'BNBx token price in USD.'

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
    config.adapterSpecificParams?.bscRpcUrl.toString(),
    config.adapterSpecificParams?.bscChainId,
  )

  const rateProvider = new ethers.Contract(BNBX_RATE_PROVIDER, rateProviderAbi, provider)
  const bnbPrice = new ethers.Contract(BSC_AGGREGATOR_PROXY, bnbAggregatorAbi, provider)

  let values
  try {
    values = await Promise.all([
      rateProvider.convertBnbXToBnb(BNBX_RATE_MULTIPLIER),
      bnbPrice.latestAnswer(),
    ])
  } catch (e: any) {
    throw new AdapterDataProviderError({
      network: 'BSC',
      message: util.mapRPCErrorMessage(e?.code, e?.message),
      cause: e,
    })
  }

  const [rate, bnbUSD] = values
  const result = bnbUSD.mul(rate).div(ethers.utils.parseUnits('1', 18)).toNumber()

  const response = {
    status: 200,
    statusText: 'OK',
    data: { result },
    headers: {},
    config: {},
  }

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
