import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, Includes } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['crypto', 'price']

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const symbolOptions = (from: string, to: string) => ({
  url: `/api/v2/market/spot/prices/pairs/${from.toLowerCase()}_${to.toLowerCase()}/latest`,
  params: { includeCrossRates: true }
})

const tokenOptions = (from: string, to: string) => ({
  url: `/api/v2/market/defi/prices/pairs/bases/${from}/quotes/${to}/latest`,
  params: {}
})

export const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  includes: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const { url, params, inverse } = getOptions(validator)
  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', 'price'], { inverse })
  return Requester.success(jobRunID, response, config.verbose)
}

const getOptions = (validator: Validator): {
  url: string
  params: Record<string, unknown>,
  inverse?: boolean
} => {
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const includes = validator.validated.data.includes || []

  const includeOptions = getIncludesOptions(validator, base, quote, includes)
  return includeOptions ?? symbolOptions(base, quote)
}

const getIncludesOptions = (validator: Validator, from: string, to: string, includes: string[] | Includes[]) => {
  const include = getIncludes(validator, from, to, includes)
  if (!include) return undefined

  if (include.tokens) {
    const fromAddress = validator.overrideToken(include.from)
    const toAddress = validator.overrideToken(include.to)
    if (!fromAddress || !toAddress) return undefined
    return {
      ...tokenOptions(fromAddress, toAddress),
      inverse: include.inverse
    }
  }

  return {
    ...symbolOptions(include.from, include.to),
    inverse: include.inverse
  }
}

const getIncludes = (validator: Validator, from: string, to: string, includes: string[] | Includes[]): Includes | undefined => {
  if (includes.length === 0) return undefined

  if (typeof includes[0] === 'string') {
    return {
      from,
      to: includes[0],
      inverse: false,
      tokens: true
    }
  }

  return validator.overrideIncludes(AdapterName, from, to, includes as Includes[])
}
