import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, AdapterResponse } from '@chainlink/types'
import { MATIC_AGGREGATOR_PROXY, STMATIC_RATE_PROVIDER } from '../config'
import rateProviderAbi from '../abi/RateProvider.json'
import maticAggregatorAbi from '../abi/MaticAggregator.json'
import { ethers } from 'ethers'

export const supportedEndpoints = ['stmatic']

export const description = 'stMATIC token price in USD.'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (
  request,
  _,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const provider = new ethers.providers.JsonRpcProvider(config.api.baseURL)

  const rateProvider = new ethers.Contract(STMATIC_RATE_PROVIDER, rateProviderAbi, provider)

  const polygonPrice = new ethers.Contract(MATIC_AGGREGATOR_PROXY, maticAggregatorAbi, provider)

  const values = await Promise.all([rateProvider.getRate(), polygonPrice.latestAnswer()])

  const rate = values[0].div(ethers.utils.parseUnits('1', 10))
  const MaticUSD = values[1]

  const result = MaticUSD.mul(rate).div(ethers.utils.parseUnits('1', 8)).toNumber()

  const response = {
    status: 200,
    statusText: 'OK',
    data: { result },
    headers: {},
    config: {},
  }

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
