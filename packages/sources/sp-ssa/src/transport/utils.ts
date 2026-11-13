import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { utc } from '@date-fns/utc'
import { isMatch, isValid, parse } from 'date-fns'
import isIn from 'validator/lib/isIn'

const SCORE_VALUES = ['1', '2', '3', '4', '5']

const TIMESTAMP_FORMATS = [
  { pattern: "yyyy-MM-dd'T'HH:mm'Z'", length: 17 },
  { pattern: "yyyy-MM-dd'T'HH:mm:ss'Z'", length: 20 },
] as const

export interface ProviderRecord {
  security_id: string
  ssa: unknown
  last_modified_date_time: unknown
}

const providerDataError = (message: string): AdapterError =>
  new AdapterError({ statusCode: 502, message })

export function parseScore(value: unknown): number {
  if (typeof value !== 'string' || !isIn(value, SCORE_VALUES)) {
    throw providerDataError('The provider SSA score is not an integer in the 1-5 range')
  }
  return Number(value)
}

export function parseTimestamp(value: unknown): number {
  if (typeof value !== 'string') {
    throw providerDataError('The provider last_modified_date_time is not a UTC ISO-8601 timestamp')
  }
  const format = TIMESTAMP_FORMATS.find(
    ({ pattern, length }) => value.length === length && isMatch(value, pattern),
  )
  if (!format) {
    throw providerDataError('The provider last_modified_date_time is not a UTC ISO-8601 timestamp')
  }

  const parsed = parse(value, format.pattern, new Date(), { in: utc })
  if (!isValid(parsed)) {
    throw providerDataError(
      'The provider last_modified_date_time is not a valid calendar timestamp',
    )
  }
  return parsed.getTime()
}

const toProviderRecord = (item: unknown): ProviderRecord => {
  if (!item || typeof item !== 'object') {
    throw providerDataError('The data provider returned a malformed payload')
  }
  const record = item as Record<string, unknown>
  if (typeof record.security_id !== 'string') {
    throw providerDataError('The data provider returned a malformed payload')
  }
  return {
    security_id: record.security_id,
    ssa: record.ssa,
    last_modified_date_time: record.last_modified_date_time,
  }
}

export function parseProviderRecords(payload: unknown): ProviderRecord[] {
  if (!Array.isArray(payload)) {
    throw providerDataError('The data provider returned a malformed payload')
  }

  const records = payload.map(toProviderRecord)
  const uniqueIds = new Set(records.map(({ security_id }) => security_id))
  if (uniqueIds.size !== records.length) {
    throw providerDataError('The data provider returned a malformed payload')
  }
  return records
}

export function selectRecord(records: ProviderRecord[], securityId: string): ProviderRecord {
  const record = records.find((item) => item.security_id === securityId)
  if (!record) {
    throw providerDataError('The data provider did not return a record')
  }
  return record
}
