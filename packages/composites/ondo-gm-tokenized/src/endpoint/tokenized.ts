import { ExecuteWithConfig, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import {
  getOndoMultiplierData,
  calculateActiveMultiplier,
  getDataStreamsPrice,
  calculateTokenizedPrice,
} from '../dataProvider'

export const supportedEndpoints = ['tokenized']

export const endpointResultPaths = {
  tokenizedPrice: 'tokenizedPrice',
}

export interface ResponseSchema {
  tokenizedPrice: string
  underlyingPrice: number
  activeMultiplier: number
  symbol: string
  feedId: string
}

export type TInputParameters = {
  symbol: string
  underlying?: string
  feedId?: string
}

export const inputParameters: InputParameters<TInputParameters> = {
  symbol: {
    description: 'GM token symbol (e.g., TSLAon, SPYon, QQQon)',
    required: true,
    type: 'string',
  },
  underlying: {
    description:
      'The base ticker (e.g., TSLA, SPY, QQQ). If not provided, will be derived from symbol',
    required: false,
    type: 'string',
  },
  feedId: {
    description:
      'Data Streams feed ID for the underlying (e.g., equities:TSLA:mid). If not provided, will be derived from symbol',
    required: false,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol

  const underlying = validator.validated.data.underlying
  const feedId = validator.validated.data.feedId

  if (!underlying || !feedId) {
    throw new Error('Both underlying and feedId must be provided or derivable from symbol')
  }

  try {
    // Step 1: Fetch multiplier data from Ondo API
    const marketData = await getOndoMultiplierData(symbol, config)

    // Step 2: Calculate active multiplier
    const activeMultiplier = calculateActiveMultiplier(marketData)

    // Step 3: Fetch underlying price from Data Streams
    const underlyingPrice = await getDataStreamsPrice(feedId, config)

    // Step 4: Calculate tokenized price
    const tokenizedPrice = calculateTokenizedPrice(underlyingPrice, activeMultiplier)

    const responseData: ResponseSchema = {
      tokenizedPrice,
      underlyingPrice,
      activeMultiplier,
      symbol,
      feedId,
    }

    const response = {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    return Requester.success(
      jobRunID,
      Requester.withResult(response, tokenizedPrice),
      config.verbose,
    )
  } catch (error) {
    throw new Error(`Failed to process tokenized price for ${symbol}: ${error}`)
  }
}
