import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'market'],
}

const quoteEventSymbols: { [key: string]: boolean } = {
  'USO/USD:AFX': true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = (validator.overrideSymbol(AdapterName) as string).toUpperCase()
  const events = quoteEventSymbols[symbol] ? 'Quote' : 'Trade'

  const url = 'events.json'

  const params = {
    events,
    symbols: symbol,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)

  const quotePath = ['Quote', symbol, 'bidPrice']
  const tradePath = ['Trade', symbol, 'price']
  response.data.result = Requester.validateResultNumber(
    response.data,
    events === 'Quote' ? quotePath : tradePath,
  )
  return Requester.success(jobRunID, response, config.verbose)
}
