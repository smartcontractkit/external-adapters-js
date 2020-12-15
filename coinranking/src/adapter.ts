import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const baseUrl = 'https://api.coinranking.com/v2'

const headers = {
  'x-access-token': util.pickRandomFromString(process.env.API_KEY, ','),
}

const referenceSymbolToUuid = async (symbol: string): Promise<string> => {
  const url = baseUrl + '/reference-currencies'

  const config = {
    url,
    headers,
  }

  const response = await Requester.request(config)
  const currency = response.data.data.currencies.find(
    (x: Record<string, unknown>) => (x['symbol'] as string).toLowerCase() === symbol.toLowerCase(),
  )
  if (!currency) throw Error(`Currency not found for symbol: ${symbol}`)
  return currency.uuid
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const referenceCurrencyUuid = await referenceSymbolToUuid(quote)

  const url = baseUrl + `/coins`

  const params = {
    referenceCurrencyUuid,
    'symbols[]': base,
  }

  const config = {
    url,
    params,
    headers,
  }

  const response = await Requester.request(config)
  response.data = response.data.data.coins.find(
    (x: Record<string, unknown>) => (x['symbol'] as string).toLowerCase() === base.toLowerCase(),
  )
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}
