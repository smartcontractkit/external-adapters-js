import {
  Validator,
  Requester,
  Logger,
  AdapterInputError,
  AdapterResponseInvalidError,
} from '@chainlink/ea-bootstrap'
import { Config, WETH, DEFAULT_NETWORK } from '../config'
import type { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { DexSubgraph, DexQueryInputParams, ReferenceModifierAction } from '../types'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'

export const NAME = 'prices'
export const supportedEndpoints = ['prices']

export type TInputParameters = {
  baseCoinTicker: string
  quoteCoinTicker: string
  dex: string
  intermediaryToken?: string
  referenceContract: string
  referenceContractDivisor: number
  theGraphQuote?: string
  network?: string
  referenceModifierAction?: string
}
const inputParameters: InputParameters<TInputParameters> = {
  baseCoinTicker: ['baseCoinTicker', 'base', 'from', 'coin'],
  quoteCoinTicker: ['quoteCoinTicker', 'quote', 'to', 'market'],
  dex: true,
  intermediaryToken: false,
  referenceContract: true,
  referenceContractDivisor: true,
  theGraphQuote: false,
  network: false,
  referenceModifierAction: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const {
    baseCoinTicker,
    quoteCoinTicker,
    dex,
    referenceContract,
    referenceContractDivisor,
    referenceModifierAction = ReferenceModifierAction.MULTIPLY,
    intermediaryToken = WETH,
    theGraphQuote,
    network,
  } = validator.validated.data
  if (!theGraphQuote && !quoteCoinTicker) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: 'quoteCoinTicker cannot be empty if theGraphQuote not supplied',
    })
  }
  const dexToUpperCase = dex.toUpperCase()
  const dexSubgraph = config.dexSubgraphs[dexToUpperCase]
  if (!dexSubgraph) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: `${dex} is currently not supported`,
    })
  }
  const inputParams: DexQueryInputParams = {
    jobRunID,
    baseCoinTicker: baseCoinTicker.toUpperCase(),
    quoteCoinTicker: theGraphQuote ? theGraphQuote.toUpperCase() : quoteCoinTicker.toUpperCase(),
    dex: dexToUpperCase,
    referenceContract,
    referenceContractDivisor,
    referenceModifierAction: referenceModifierAction.toUpperCase() as ReferenceModifierAction,
    intermediaryToken: intermediaryToken.toUpperCase(),
    network: network || DEFAULT_NETWORK,
  }
  if (baseCoinTicker === quoteCoinTicker) {
    throw new AdapterInputError({
      jobRunID,
      statusCode: 400,
      message: 'Base and Quote coins must be different',
    })
  }
  Logger.info(`Fetching quote for ${quoteCoinTicker}/${baseCoinTicker} pair from ${dex}`)
  let price
  try {
    price = await getQuotePrice(inputParams, dexSubgraph)
  } catch (e: any) {
    throw new Error(`Failed to get price. Reason "${e}"`)
  }
  return Requester.success(
    jobRunID,
    {
      status: 200,
      data: {
        result: price,
      },
    },
    true,
  )
}

const getQuotePrice = async (
  inputParams: DexQueryInputParams,
  dexSubgraph: DexSubgraph,
): Promise<number> => {
  const { jobRunID, baseCoinTicker, quoteCoinTicker, referenceContract } = inputParams
  const token0 = await dexSubgraph.getToken(jobRunID, baseCoinTicker)
  const token1 = await dexSubgraph.getToken(jobRunID, quoteCoinTicker)
  let token1PerToken0 = await dexSubgraph.getTokenPairPrice(jobRunID, token0.id, token1.id)
  if (!token1PerToken0) {
    token1PerToken0 = await getPriceThroughCommonPair(
      inputParams,
      dexSubgraph,
      token0.id,
      token1.id,
    )
  }
  Logger.info(`Price of ${quoteCoinTicker}/${baseCoinTicker} is ${token1PerToken0}`)
  if (referenceContract) {
    token1PerToken0 = await modifyResultByFeedResult(inputParams, token1PerToken0)
  }
  return token1PerToken0
}

const getPriceThroughCommonPair = async (
  inputParams: DexQueryInputParams,
  dexSubgraph: DexSubgraph,
  token0ID: string,
  token1ID: string,
): Promise<number> => {
  const {
    jobRunID,
    baseCoinTicker,
    quoteCoinTicker,
    intermediaryToken: intermediaryTokenTicker,
  } = inputParams
  Logger.info(
    `${quoteCoinTicker}/${baseCoinTicker} pair does not exist.  Determining price using intermediary token ${intermediaryTokenTicker}`,
  )
  const intermediaryToken = await dexSubgraph.getToken(jobRunID, intermediaryTokenTicker)
  const refTokenPerToken0 = await dexSubgraph.getTokenPairPrice(
    jobRunID,
    token0ID,
    intermediaryToken.id,
  )
  const refTokenPerToken1 = await dexSubgraph.getTokenPairPrice(
    jobRunID,
    token1ID,
    intermediaryToken.id,
  )
  validateTokenPrices(refTokenPerToken0, refTokenPerToken1, baseCoinTicker, quoteCoinTicker)
  return (refTokenPerToken0 as number) / (refTokenPerToken1 as number)
}

const validateTokenPrices = (
  priceOne: number | null,
  priceTwo: number | null,
  priceOneTicker: string,
  priceTwoTicker: string,
) => {
  if (!priceOne || !priceTwo) {
    if (!priceOne) {
      throw new AdapterResponseInvalidError({
        message: `Failed to get price because we could not determine the price of ${priceOneTicker}`,
      })
    }
    if (!priceTwo) {
      throw new AdapterResponseInvalidError({
        message: `Failed to get price because we could not determine the price of ${priceTwoTicker}`,
      })
    }
  }
}

const modifyResultByFeedResult = async (
  inputParams: DexQueryInputParams,
  currentPrice: number,
): Promise<number> => {
  const {
    baseCoinTicker,
    quoteCoinTicker,
    referenceContract,
    referenceContractDivisor,
    referenceModifierAction,
    network,
  } = inputParams
  Logger.info(
    `Price of ${quoteCoinTicker}/${baseCoinTicker} is going to be modified by the result returned from ${referenceContract} by ${referenceContractDivisor}`,
  )
  const modifierTokenPrice = await getLatestAnswer(
    network,
    referenceContract,
    referenceContractDivisor,
  )
  Logger.info(`Feed ${referenceContract} returned a value of ${modifierTokenPrice}`)
  if (referenceModifierAction === ReferenceModifierAction.DIVIDE) {
    return currentPrice / modifierTokenPrice
  }
  return currentPrice * modifierTokenPrice
}
