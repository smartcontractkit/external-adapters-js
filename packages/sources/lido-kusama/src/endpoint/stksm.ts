import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, AdapterResponse } from '@chainlink/types'
import { KSM_AGGREGATOR_PROXY, STKSM_RATE_PROVIDER, OUTPUT_DECIMALS } from '../config'
import rateProviderAbi from '../abi/RateProvider.json'
import ksmAggregatorAbi from '../abi/KsmAggregator.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['stksm']

export const description = 'stKSM token price in USD'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (
  request,
  _,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.api.baseURL)

  const rateProvider = new ethers.Contract(STKSM_RATE_PROVIDER, rateProviderAbi, provider)

  const kusamaPrice = new ethers.Contract(KSM_AGGREGATOR_PROXY, ksmAggregatorAbi, provider)

  const values = await Promise.all([
    rateProvider.getVirtualPrice(),
    kusamaPrice.latestRoundData(),
    kusamaPrice.decimals(),
  ])

  const rate = values[0].div(ethers.utils.parseUnits('1', 10))
  const ksmUsd = values[1].answer
  const proxyDecimals = values[2]

  const result = ksmUsd
    .mul(ethers.utils.parseUnits('1', 8))
    .div(rate)
    .mul(ethers.utils.parseUnits('1', OUTPUT_DECIMALS))
    .div(ethers.utils.parseUnits('1', proxyDecimals))
    .toNumber()

  const response = {
    status: 200,
    statusText: 'OK',
    data: { result },
    headers: {},
    config: {},
  }

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
