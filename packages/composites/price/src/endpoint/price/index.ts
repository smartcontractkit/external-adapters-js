import { Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterContext,
  AdapterRequest,
  AdapterResponse,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
import { Config } from '../../config'
import { convertUSDQuote, getTokenPrice } from '../../utils'
import * as beth from './beth'
import * as bluna from './bluna'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market'],
  quoteDecimals: false,
  source: false,
}

export type PriceExecute = (
  input: AdapterRequest,
  context: AdapterContext,
  config: Config,
  taAdapterResponse: AdapterResponse,
) => Promise<AdapterResponse>

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error

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
      throw Error(`Invalid from symbol ${fromUpperCase}`)
  }
  const taResponse = await getTokenPrice(input, context, intermediaryTokenSymbol, taDecimals)
  const resultInUSD = await priceExecute(input, context, config, taResponse)

  if (to === 'USD') return resultInUSD
  const convertedResult = await convertUSDQuote(
    input,
    context,
    resultInUSD.data.result,
    to,
    quoteDecimals,
  )
  return {
    jobRunID: input.id,
    statusCode: 200,
    result: convertedResult,
    data: {
      result: convertedResult,
    },
  }
}
