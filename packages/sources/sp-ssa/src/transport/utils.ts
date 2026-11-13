import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export interface ProviderRecord {
  security_id: string
  ssa: unknown
  last_modified_date_time: unknown
}

export function parseScore(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-5]$/.test(value)) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The provider SSA score is not an integer in the 1-5 range',
    })
  }
  return Number(value)
}

export function parseTimestamp(value: unknown): number {
  const match =
    typeof value === 'string'
      ? /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?Z$/.exec(value)
      : null
  if (!match) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The provider last_modified_date_time is not a UTC ISO-8601 timestamp',
    })
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? '0')
  const timestampMs = Date.UTC(year, month - 1, day, hour, minute, second)
  const date = new Date(timestampMs)
  if (
    !Number.isFinite(timestampMs) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The provider last_modified_date_time is not a valid calendar timestamp',
    })
  }
  return timestampMs
}

export function parseProviderRecords(payload: unknown): ProviderRecord[] {
  if (!Array.isArray(payload)) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The data provider returned a malformed payload',
    })
  }

  const records: ProviderRecord[] = []
  const seen = new Set<string>()
  for (const item of payload) {
    if (!item || typeof item !== 'object') {
      throw new AdapterError({
        statusCode: 502,
        message: 'The data provider returned a malformed payload',
      })
    }
    const record = item as Record<string, unknown>
    if (typeof record.security_id !== 'string' || seen.has(record.security_id)) {
      throw new AdapterError({
        statusCode: 502,
        message: 'The data provider returned a malformed payload',
      })
    }
    seen.add(record.security_id)
    records.push({
      security_id: record.security_id,
      ssa: record.ssa,
      last_modified_date_time: record.last_modified_date_time,
    })
  }
  return records
}

export function selectRecord(records: ProviderRecord[], securityId: string): ProviderRecord {
  const record = records.find((item) => item.security_id === securityId)
  if (!record) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The data provider did not return a record',
    })
  }
  return record
}
