import { AdapterContext, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { BigNumber, ethers } from 'ethers'
import { FIXED_POINT_DECIMALS } from './config'
import * as view from '@chainlink/terra-view-function-adapter'

export const getTokenPrice = async (
  input: AdapterRequest,
  context: AdapterContext,
  feedAddress: string,
  decimals = 8, // Most Terra feed have 8dp
): Promise<ethers.BigNumber> => {
  const feedResponse = await callViewFunctionEA(input, context, feedAddress, {
    aggregator_query: { get_latest_round_data: {} },
  })
  const latestAnswer = feedResponse.data.result.answer
  return ethers.utils.parseUnits(latestAnswer, decimals)
}

export const convertUSDQuote = async (
  input: AdapterRequest,
  context: AdapterContext,
  usdPrice: ethers.BigNumber,
  targetQuoteFeedAddress: string,
  targetQuoteDecimals = 8,
): Promise<ethers.BigNumber> => {
  const targetQuoteUSDRate = await getTokenPrice(
    input,
    context,
    targetQuoteFeedAddress,
    targetQuoteDecimals,
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
      ...input.data,
    },
  }
  return await _execute(viewFunctionAdapterRequest, context)
}
