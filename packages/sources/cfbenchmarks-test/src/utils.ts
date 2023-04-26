type BaseQuoteToIdLookup = { [id: string]: { base: string; quote: string } }

const overridenBaseQuoteFromId: BaseQuoteToIdLookup = {
  BRTI: { base: 'BTC', quote: 'USD' },
}

export const getBaseQuoteFromId = (id: string): { base: string; quote: string } => {
  const override = overridenBaseQuoteFromId[id]
  if (override) return override

  const noPrefix = id.replace('U_', '')
  const noSuffix = noPrefix.replace('_RTI', '')
  const [base, quote] = noSuffix.split('/')
  return { base, quote }
}

type IdToBaseQuoteLookup = { [base: string]: { [quote: string]: string } }

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

export const getPrimaryId = (base: string, quote: string): string => `${base}${quote}_RTI`
export const getSecondaryId = (base: string, quote: string): string => `U_${base}${quote}_RTI`

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

// Tenor must be between -1 and 1
export const tenorInRange = (tenor: number): boolean => tenor >= -1 && tenor <= 1
// Check if time of latest update is in the current day in UTC time
export const latestUpdateIsCurrentDay = (utcTimeOfUpdate: number): boolean => {
  try {
    const latestUpdateDate = new Date(utcTimeOfUpdate)
    const currentDay = new Date()
    return (
      latestUpdateDate.getUTCFullYear() === currentDay.getUTCFullYear() &&
      latestUpdateDate.getUTCMonth() === currentDay.getUTCMonth() &&
      latestUpdateDate.getUTCDate() === currentDay.getUTCDate()
    )
  } catch (error) {
    return false
  }
}
