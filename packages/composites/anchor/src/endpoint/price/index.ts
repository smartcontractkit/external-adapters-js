import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterContext,
  AdapterRequest,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
import { ethers } from 'ethers'
import { Config, FIXED_POINT_DECIMALS } from '../../config'
import { convertUSDQuote, getTokenPrice } from '../../utils'
import * as beth from './beth'
import * as bluna from './bluna'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  from: {
    required: true,
    aliases: ['base'],
    description: 'The symbol of the currency to query',
    options: ['bETH', 'bLUNA'],
  },
  to: {
    required: true,
    aliases: ['quote'],
    description: 'The symbol of the currency to convert to',
    options: ['ETH', 'USD'],
  },
  conversionFeedDecimals: {
    description: "The number of decimals the to symbol uses in it's Terra feed",
    default: 8,
  },
}

export type PriceExecute = (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
  intermediaryTokenRate: ethers.BigNumber,
) => Promise<ethers.BigNumber>

const supportedSymbols = [beth.FROM, bluna.FROM]

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const { from, to, conversionFeedDecimals } = validator.validated.data
  const fromUpperCase = from.toUpperCase()
  let priceExecute: PriceExecute
  let intermediaryTokenFeedAddress: string
  switch (fromUpperCase) {
    case beth.FROM:
      priceExecute = beth.execute
      intermediaryTokenFeedAddress = config.feedAddresses[beth.INTERMEDIARY_TOKEN.toLowerCase()]
      break
    case bluna.FROM:
      priceExecute = bluna.execute
      intermediaryTokenFeedAddress = config.feedAddresses[bluna.INTERMEDIARY_TOKEN.toLowerCase()]
      break
    default:
      throw Error(
        `Invalid from symbol ${fromUpperCase}.  Supported Symbols ${supportedSymbols.join(',')}`,
      )
  }
  const intermediaryTokenPrice = await getTokenPrice(input, context, intermediaryTokenFeedAddress)
  let result = await priceExecute(input, context, config, intermediaryTokenPrice)

  if (to.toUpperCase() !== 'USD') {
    const toConversionFeedAddress = mapToSymbolToAddress(input.id, to, config)
    result = await convertUSDQuote(
      input,
      context,
      result,
      toConversionFeedAddress,
      conversionFeedDecimals,
    )
  }

  const resToRequiredDP = result
    .div(ethers.BigNumber.from(10).pow(FIXED_POINT_DECIMALS - config.feedDecimals))
    .toString()
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: resToRequiredDP,
    data: {
      result: resToRequiredDP,
    },
  }
}

const mapToSymbolToAddress = (jobRunID: string, symbol: string, config: Config): string => {
  if (!config.feedAddresses[symbol.toLowerCase()])
    throw new AdapterError({
      jobRunID,
      statusCode: 400,
      message: `${symbol} is not a supported conversion currency`,
    })
  return config.feedAddresses[symbol]
}
