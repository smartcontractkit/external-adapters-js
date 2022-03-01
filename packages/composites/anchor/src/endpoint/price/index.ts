import { Validator } from '@chainlink/ea-bootstrap'
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
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market'],
  quoteDecimals: false,
  source: false,
  terraBLunaContractAddress: false,
}

export type PriceExecute = (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
  taAdapterResponse: ethers.BigNumber,
) => Promise<ethers.BigNumber>

const supportedSymbols = [beth.FROM, bluna.FROM]

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)

  const { from, to, quoteDecimals } = validator.validated.data
  const fromUpperCase = from.toUpperCase()
  let taDecimals: number
  let priceExecute: PriceExecute
  let intermediaryTokenSymbol: string
  switch (fromUpperCase) {
    case beth.FROM:
      taDecimals = beth.INTERMEDIARY_TOKEN_DECIMALS
      priceExecute = beth.execute
      intermediaryTokenSymbol = beth.INTERMEDIARY_TOKEN
      break
    case bluna.FROM:
      taDecimals = bluna.INTERMEDIARY_TOKEN_DECIMALS
      priceExecute = bluna.execute
      intermediaryTokenSymbol = bluna.INTERMEDIARY_TOKEN
      break
    default:
      throw Error(
        `Invalid from symbol ${fromUpperCase}.  Supported Symbols ${supportedSymbols.join(',')}`,
      )
  }
  const taResponse = await getTokenPrice(input, context, intermediaryTokenSymbol, taDecimals)
  const taResponseBigNum = ethers.utils.parseUnits(
    taResponse.data.result.toString(),
    FIXED_POINT_DECIMALS,
  )
  let result = await priceExecute(input, context, config, taResponseBigNum)

  if (to.toUpperCase() !== 'USD') {
    result = await convertUSDQuote(input, context, result, to, quoteDecimals)
  }

  const resString = result.toString()
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: resString,
    data: {
      result: resString,
    },
  }
}
