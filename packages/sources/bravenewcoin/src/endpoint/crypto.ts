import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { authenticate, convert, getAssetId } from '../helpers'

export const supportedEndpoints = ['crypto', 'price']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
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
