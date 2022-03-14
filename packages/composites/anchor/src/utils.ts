import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { FIXED_POINT_DECIMALS } from './config'
import * as view from '@chainlink/terra-view-function-adapter'
import { AdapterError } from '@chainlink/ea-bootstrap'

export const getTokenPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
  feedAddress: string,
  feedDecimals = 8,
): Promise<ethers.BigNumber> => {
  const feedResponse = await callViewFunctionEA(input, context, feedAddress, 'latest_round_data')
  const latestAnswer = feedResponse.data.result.answer
  const result = ethers.utils.parseUnits(latestAnswer, FIXED_POINT_DECIMALS - feedDecimals)
  throwErrorForInvalidResult(input.id, result, `Chainlink Terra feed ${feedAddress}`)
  return result
}

export const convertUSDQuote = async (
  input: AdapterRequest,
  context: AdapterContext,
  usdPrice: ethers.BigNumber,
  targetQuoteFeedAddress: string,
  feedDecimals = 8,
): Promise<ethers.BigNumber> => {
  const targetQuoteUSDRate = await getTokenPrice(
    input,
    context,
    targetQuoteFeedAddress,
    feedDecimals,
  )
  return usdPrice.mul(BigNumber.from(10).pow(FIXED_POINT_DECIMALS)).div(targetQuoteUSDRate)
}

export const callViewFunctionEA = async (
  input: AdapterRequest,
  context: AdapterContext,
  address: string,
  query: unknown,
): Promise<AdapterResponse> => {
  const _config = view.makeConfig()
  const _execute = view.makeExecute(_config)
  const viewFunctionAdapterRequest: AdapterRequest = {
    id: input.id,
    data: {
      address,
      query,
    },
  }
  return await _execute(viewFunctionAdapterRequest, context)
}

export const throwErrorForInvalidResult = (
  jobRunID: string,
  value: ethers.BigNumber,
  label: string,
): void => {
  if (value.lte(BigNumber.from('0')))
    throw new AdapterError({
      jobRunID,
      statusCode: 500,
      message: `Invalid result for ${label}`,
    })
}
