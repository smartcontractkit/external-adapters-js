import { BaseEndpointTypes, inputParameters } from './crypto'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

export const getPrimaryId = (base: string, quote: string): string => `${base}${quote}_RTI`
export const getSecondaryId = (base: string, quote: string): string => `U_${base}${quote}_RTI`

type IdToBaseQuoteLookup = { [base: string]: { [quote: string]: string } }

type BaseQuoteToIdLookup = { [id: string]: { base: string; quote: string } }

const overridenBaseQuoteFromId: BaseQuoteToIdLookup = {
  BRTI: { base: 'BTC', quote: 'USD' },
}

export function customInputValidation(
  req: AdapterRequest<typeof inputParameters.validated>,
  adapterSettings: BaseEndpointTypes['Settings'],
): AdapterError | undefined {
  if (adapterSettings.API_SECONDARY) {
    req.requestContext.data.adapterNameOverride = 'cfbenchmarks2'
  }

  const { base, quote, index } = req.requestContext.data
  // Base and quote must be provided OR index must be provided
  if (!(index || (base && quote))) {
    const missingInput = !index ? 'index' : 'base /or quote'
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: missing ${missingInput} input parameters`,
    })
  }
  return
}

export const getBaseQuoteFromId = (id: string): { base: string; quote: string } => {
  const override = overridenBaseQuoteFromId[id]
  if (override) return override

  const noPrefix = id.replace('U_', '')
  const noSuffix = noPrefix.replace('_RTI', '')
  const [base, quote] = noSuffix.split('/')
  return { base, quote }
}
const buildIdOverrideFromBaseQuote = (
  baseQuoteToIdLookup: BaseQuoteToIdLookup,
): IdToBaseQuoteLookup =>
  Object.entries(baseQuoteToIdLookup).reduce((idToBaseQuote, [id, { base, quote }]) => {
    idToBaseQuote[base] = { [quote]: id }
    return idToBaseQuote
  }, {} as IdToBaseQuoteLookup)

const idOverrideFromBaseQuote: IdToBaseQuoteLookup =
  buildIdOverrideFromBaseQuote(overridenBaseQuoteFromId)
export const overrideId = (base: string, quote: string): string | undefined => {
  const baseOverride = idOverrideFromBaseQuote[base]
  if (baseOverride) {
    return baseOverride[quote]
  } else {
    return undefined
  }
}

export const getIdFromBaseQuote = (
  base: string,
  quote: string,
  type: 'primary' | 'secondary',
): string => {
  const override = overrideId(base, quote)
  if (override) return override

  if (type === 'secondary') return getSecondaryId(base, quote)
  return getPrimaryId(base, quote)
}

export function requestTransform(endpoint: string) {
  return (
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: BaseEndpointTypes['Settings'],
  ) => {
    const { base, quote, index } = req.requestContext.data
    const rawRequestData = req.body.data
    // If `base` in requestContext.data is not the same as in raw request data, it means the value is overriden, use that for index
    const baseAliases = ['base', ...inputParameters.definition.base.aliases]
    if (baseAliases.every((alias) => base !== rawRequestData[alias])) {
      req.requestContext.data.index = base
    } else if (!index) {
      if (endpoint === 'crypto') {
        const isSecondary = settings.API_SECONDARY
        const type = isSecondary ? 'secondary' : 'primary'
        // If there is no index set
        // we know that base and quote exist from the customInputValidation
        req.requestContext.data.index = getIdFromBaseQuote(base as string, quote as string, type)
      } else if (endpoint === 'crypto-lwba') {
        req.requestContext.data.index = getSecondaryId(base as string, quote as string)
      }
    }
    // Clear base quote to ensure an exact match in the cache with index
    delete req.requestContext.data.base
    delete req.requestContext.data.quote
  }
}
