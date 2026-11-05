import { isValid, parseISO } from 'date-fns'
import isDecimal from 'validator/lib/isDecimal'

export class ProviderDataError extends Error {}

interface RipcordFields {
  ripcord?: unknown
  ripcordDetails?: unknown
}

export const parseNumber = (value: unknown, field: string): number => {
  if (typeof value !== 'string' || !isDecimal(value)) {
    throw new ProviderDataError(`${field} is not a valid value: ${String(value)}`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new ProviderDataError(`${field} is not a valid value: ${String(value)}`)
  }
  return parsed
}

export const parseDateMs = (value: unknown): number => {
  if (typeof value !== 'string') {
    throw new ProviderDataError(`net_asset_value_date is not a valid value: ${String(value)}`)
  }
  const parsed = parseISO(`${value}T00:00:00Z`)
  if (!parsed || !isValid(parsed) || parsed.getTime() < 0) {
    throw new ProviderDataError(`net_asset_value_date is not a valid value: ${String(value)}`)
  }
  if (parsed.toISOString().slice(0, 10) !== value) {
    throw new ProviderDataError(`net_asset_value_date is not a valid value: ${String(value)}`)
  }
  return parsed.getTime()
}

export const parseTimestampMs = (value: unknown): number => {
  if (typeof value !== 'string') {
    throw new ProviderDataError(`updatedAt is not a valid value: ${String(value)}`)
  }
  const parsed = parseISO(value)
  if (!parsed || !isValid(parsed) || parsed.getTime() < 0) {
    throw new ProviderDataError(`updatedAt is not a valid value: ${String(value)}`)
  }
  const iso = parsed.toISOString()
  const dot = value.lastIndexOf('.')
  const fraction = dot > 0 && value.endsWith('Z') ? value.slice(dot + 1, -1) : ''
  const normalized =
    fraction.length > 0 && fraction.length <= 3
      ? `${value.slice(0, dot + 1)}${fraction.padEnd(3, '0')}Z`
      : value
  if (iso !== normalized && iso.replace('.000Z', 'Z') !== value) {
    throw new ProviderDataError(`updatedAt is not a valid value: ${String(value)}`)
  }
  return parsed.getTime()
}

export const checkRipcord = (
  data: RipcordFields | null | undefined,
): { ripcord: boolean; ripcordAsInt: number } => {
  if (!data || typeof data.ripcord !== 'boolean') {
    throw new ProviderDataError(`ripcord is not a valid value: ${String(data?.ripcord)}`)
  }

  if (data.ripcordDetails !== undefined && !Array.isArray(data.ripcordDetails)) {
    throw new ProviderDataError(
      `ripcordDetails is not a valid value: ${String(data.ripcordDetails)}`,
    )
  }

  if (data.ripcord) {
    const details = Array.isArray(data.ripcordDetails) ? data.ripcordDetails.join(', ') : ''
    throw new ProviderDataError(`Ripcord indicator true. Details: ${details}`)
  }

  return { ripcord: false, ripcordAsInt: 0 }
}
