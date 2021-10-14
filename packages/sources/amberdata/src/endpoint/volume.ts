import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, Includes, IncludePair, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['volume']

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const today = new Date()
const yesterday = new Date(today)

const symbolOptions = (from: string, to: string) => ({
  url: `/api/v2/market/spot/prices/pairs/${from.toLowerCase()}_${to.toLowerCase()}/historical`,
  params: {
    timeInterval: 'd',
    startDate: yesterday.setDate(yesterday.getDate() - 1),
    endDate: today.valueOf(),
    includeCrossRates: true,
  },
})

const tokenOptions = (from: string, to: string) => ({
  url: `/api/v2/market/defi/prices/pairs/bases/${from}/quotes/${to}/historical`,
  params: {
    timeInterval: 'd',
    startDate: yesterday.setDate(yesterday.getDate() - 1),
    endDate: today.valueOf(),
  },
})

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  includes: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const { url, params, inverse } = getOptions(validator)
  const reqConfig = { ...config.api, params, url }

  const response = await Requester.request(reqConfig, customError)
  console.log(response.data.payload.data)
  response.data.result = Requester.validateResultNumber(
    response.data,
    ['payload', 'data', 0, 'volume'],
    {
      inverse,
    },
  )
  return Requester.success(jobRunID, response, config.verbose)
}

const getOptions = (
  validator: Validator,
): {
  url: string
  params: Record<string, unknown>
  inverse?: boolean
} => {
  const base = validator.overrideSymbol(AdapterName) as string
  const quote = validator.validated.data.quote
  const includes = validator.validated.includes || []

  const includeOptions = getIncludesOptions(validator, base, quote, includes)
  return includeOptions ?? symbolOptions(base, quote)
}

const getIncludesOptions = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
) => {
  const include = getIncludes(validator, from, to, includes)
  if (!include) return undefined
  if (include.tokens) {
    const fromAddress = validator.overrideToken(include.from)
    const toAddress = validator.overrideToken(include.to)

    if (!fromAddress || !toAddress) return undefined
    return {
      ...tokenOptions(fromAddress, toAddress),
      inverse: include.inverse,
    }
  }

  return {
    ...symbolOptions(include.from, include.to),
    inverse: include.inverse,
  }
}

const getIncludes = (
  validator: Validator,
  from: string,
  to: string,
  includes: string[] | Includes[],
): IncludePair | undefined => {
  if (includes.length === 0) return undefined

  const presetIncludes = validator.overrideIncludes(AdapterName, from, to)
  if (presetIncludes && typeof includes[0] === 'string') return presetIncludes
  else if (typeof includes[0] === 'string') {
    return {
      from,
      to: includes[0],
      inverse: false,
      tokens: true,
    }
  }
  return presetIncludes
}
