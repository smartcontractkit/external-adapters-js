import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { assets } from '.'

export const supportedEndpoints = ['crypto', 'price']

const customError = (data: any) => data.Response === 'Error'

export const customParams = {
  from: ['base', 'from', 'coin'],
  to: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const to = validator.validated.data.to.toUpperCase()
  // The Assets endpoint supports batch requests for USD quotes. If possible, use it.
  if (to === 'USD')
    return await assets.execute(
      { ...request, data: { ...request.data, endpoint: 'assets' } },
      config,
    )

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  if (quote?.toUpperCase() === 'USD') return await assets.execute(request, config)

  const url = `exchangerate/${symbol}/${quote}`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['rate'])

  return Requester.success(jobRunID, response, config.verbose)
}
