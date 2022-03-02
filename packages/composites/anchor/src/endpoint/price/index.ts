import { Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterContext,
  AdapterRequest,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
import { ethers } from 'ethers'
import { Config } from '../../config'
import { convertUSDQuote, getTokenPrice } from '../../utils'
import * as beth from './beth'
import * as bluna from './bluna'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market'],
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
  let priceExecute: PriceExecute
  let intermediaryTokenFeedAddress: string
  switch (fromUpperCase) {
    case beth.FROM:
      priceExecute = beth.execute
      intermediaryTokenFeedAddress = 'terra19ws7jhe5npxkhz0x7fyv5jld87lt07l7g8zzdk'
      break
    case bluna.FROM:
      priceExecute = bluna.execute
      intermediaryTokenFeedAddress = 'terra1u475ps69rmhpf4f4gx2pc74l7tlyu4hkj4wp9d'
      break
    default:
      throw Error(
        `Invalid from symbol ${fromUpperCase}.  Supported Symbols ${supportedSymbols.join(',')}`,
      )
  }
  const intermediaryTokenPrice = await getTokenPrice(input, context, intermediaryTokenFeedAddress)
  let result = await priceExecute(input, context, config, intermediaryTokenPrice)

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
