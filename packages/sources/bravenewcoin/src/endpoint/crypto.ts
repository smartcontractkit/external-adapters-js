import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { authenticate, convert, getAssetId } from '../helpers'

export const supportedEndpoints = ['crypto', 'price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    options: ['BTC', 'ETH', 'USD'],
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    options: ['BTC', 'ETH', 'USD'],
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const token = await authenticate()
  const baseAssetId = await getAssetId(from)
  const quoteAssetId = to.toUpperCase() === 'USD' ? 'USD' : await getAssetId(to)

  const response = await convert(token, baseAssetId, quoteAssetId)

  return Requester.success(jobRunID, response, config.verbose)
}
