import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { authenticate, convert, getAssetId } from '../helpers'

export const supportedEndpoints = ['crypto', 'price']

export const description = `[BraveNewCoin's AssetTicker endpoint](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_836afc6

**NOTE: the \`price\` endpoint is temporarily still supported, however, is being deprecated. Please use the \`crypto\` endpoint instead.**`

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const token = await authenticate()
  const baseAssetId = await getAssetId(from)
  const quoteAssetId = to.toUpperCase() === 'USD' ? 'USD' : await getAssetId(to)

  const response = await convert(token, baseAssetId, quoteAssetId)

  return Requester.success(jobRunID, response, config.verbose)
}
