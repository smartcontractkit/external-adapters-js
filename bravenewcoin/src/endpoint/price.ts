import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { authenticate, convert, getAssetId } from '../helpers'

export const NAME = 'price'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const from = validator.validated.data.base
  const to = validator.validated.data.quote

  const token = await authenticate()
  const baseAssetId = await getAssetId(from)
  const quoteAssetId = to.toUpperCase() === 'USD' ? 'USD' : await getAssetId(to)

  const response = await convert(token, baseAssetId, quoteAssetId)

  return Requester.success(jobRunID, response)
}
