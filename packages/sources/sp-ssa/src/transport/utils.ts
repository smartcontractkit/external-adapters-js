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
  if (typeof value !== 'string') {
    throw new AdapterError({
      statusCode: 502,
      message: 'The provider last_modified_date_time is not a string',
    })
  }
  const timestampMs = new Date(value).getTime()
  if (!Number.isFinite(timestampMs)) {
    throw new AdapterError({
      statusCode: 502,
      message: 'The provider last_modified_date_time is not parseable',
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
  for (const item of payload) {
    if (!item || typeof item !== 'object') {
      throw new AdapterError({
        statusCode: 502,
        message: 'The data provider returned a malformed payload',
      })
    }
    const record = item as Record<string, unknown>
    if (typeof record.security_id !== 'string') {
      throw new AdapterError({
        statusCode: 502,
        message: 'The data provider returned a malformed payload',
      })
    }
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
