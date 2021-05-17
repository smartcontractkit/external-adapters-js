import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const Name = 'convert'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  amount: false,
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const from = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const to = validator.validated.data.quote.toUpperCase()
  const amount = validator.validated.data.amount || 1
  const url = `convert`

  console.log('FROM', from)

  const params = {
    access_key: config.apiKey,
    from,
    to,
    amount,
  }

  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  return response.data
}
