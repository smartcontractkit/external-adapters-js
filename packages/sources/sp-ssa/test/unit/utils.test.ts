import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import {
  parseProviderRecords,
  parseScore,
  parseTimestamp,
  selectRecord,
} from '../../src/transport/utils'
import { scoresFixture, scoresWith } from '../fixtures'

const thrownError = (fn: () => unknown): AdapterError => {
  let caught: unknown
  try {
    fn()
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(AdapterError)
  expect(caught).toMatchObject({ statusCode: 502 })
  return caught as AdapterError
}

const recordedRecords = () => parseProviderRecords(scoresFixture())

describe('parseScore', () => {
  it('parses the recorded score strings as integers', () => {
    expect(parseScore('2')).toBe(2)
    expect(parseScore('5')).toBe(5)
  })

  it('accepts the inclusive minimum of the score range', () => {
    expect(parseScore('1')).toBe(1)
  })

  it('accepts the inclusive maximum of the score range', () => {
    expect(parseScore('5')).toBe(5)
  })

  it('rejects a score with a 502 that names the score field', () => {
    const error = thrownError(() => parseScore('0'))
    expect(error.message).toContain('SSA score')
  })

  it('rejects a score above the range with a 502 that names the score field', () => {
    const error = thrownError(() => parseScore('6'))
    expect(error.message).toContain('SSA score')
  })

  it('rejects a score that is not an integer string', () => {
    const error = thrownError(() => parseScore('2.5'))
    expect(error.message).toContain('SSA score')
  })

  it('rejects a score that carries whitespace', () => {
    const error = thrownError(() => parseScore(' 2 '))
    expect(error.message).toContain('SSA score')
  })
})

describe('parseTimestamp', () => {
  it('parses the recorded timestamp that carries seconds', () => {
    expect(parseTimestamp('2025-12-19T00:00:00Z')).toBe(1766102400000)
  })

  it('parses the contract timestamp that omits seconds', () => {
    expect(parseTimestamp('2025-01-17T00:00Z')).toBe(1737072000000)
  })

  it.each([
    ['not a timestamp', 'not-a-date'],
    ['missing the zone', '2025-01-17T00:00:00'],
    ['an impossible calendar day', '2025-02-30T00:00Z'],
    ['a single-digit month and day', '2025-1-7T00:00Z'],
    ['an impossible hour', '2025-01-17T24:00Z'],
  ])('rejects a timestamp that is %s', (_, value) => {
    const error = thrownError(() => parseTimestamp(value))
    expect(error.message).toContain('last_modified_date_time')
  })

  it('rejects a timestamp before the accepted range', () => {
    const error = thrownError(() => parseTimestamp('1900-01-01T00:00Z'))
    expect(error.message).toContain('last_modified_date_time')
    expect(error.message).toContain('range')
  })

  it('rejects a timestamp after the accepted range', () => {
    const error = thrownError(() => parseTimestamp('9999-12-31T23:59Z'))
    expect(error.message).toContain('last_modified_date_time')
    expect(error.message).toContain('range')
  })
})

describe('parseProviderRecords', () => {
  it('reads the recorded reply as eleven unique records', () => {
    const records = recordedRecords()
    expect(records).toHaveLength(11)
    const ids = records.map(({ security_id }) => security_id)
    expect(new Set(ids).size).toBe(records.length)
    expect(ids).toEqual(expect.arrayContaining(['SP-EURC', 'SP-USDC', 'SP-USDe']))
    expect(ids.every((id) => typeof id === 'string')).toBe(true)
  })

  it.each([
    ['the payload is not an array', {}],
    ['an element is null', [null]],
    ['an element is not an object', ['SP-EURC']],
    ['an element has a non-string security id', [{ security_id: 1 }]],
    [
      'two elements share an id',
      [
        { security_id: 'SP-DUP', ssa: '2', last_modified_date_time: '2025-12-19T00:00:00Z' },
        { security_id: 'SP-DUP', ssa: '2', last_modified_date_time: '2025-12-19T00:00:00Z' },
      ],
    ],
  ])('rejects a malformed payload when %s', (_, payload) => {
    const error = thrownError(() => parseProviderRecords(payload))
    expect(error.message).toContain('malformed payload')
  })

  it('publishes a record that omits the unused string fields', () => {
    const [record] = parseProviderRecords([
      {
        last_modified_date_time: '2025-12-19T00:00:00Z',
        security_id: 'SP-MINIMAL',
        ssa: '5',
      },
    ])
    expect(record).toEqual({
      security_id: 'SP-MINIMAL',
      ssa: '5',
      last_modified_date_time: '2025-12-19T00:00:00Z',
    })
    expect(parseScore(record.ssa)).toBe(5)
    expect(parseTimestamp(record.last_modified_date_time)).toBe(1766102400000)
  })
})

describe('selectRecord', () => {
  it('rejects a configured id that is absent from the provider array', () => {
    const error = thrownError(() => selectRecord(recordedRecords(), 'SP-UNKNOWN'))
    expect(error.message).toContain('did not return a record')
  })

  it('selects the recorded mixed-case id exactly', () => {
    const records = recordedRecords()
    const record = selectRecord(records, 'SP-USDe')
    expect(record.security_id).toBe('SP-USDe')
    expect(parseScore(record.ssa)).toBe(5)
    expect(() => selectRecord(records, 'SP-USDE')).toThrow()
  })

  it('does not read an unrelated element with a bad score', () => {
    const records = parseProviderRecords([
      ...scoresWith('SP-EURC'),
      { security_id: 'SP-UNRELATED', ssa: 'not-assessed', last_modified_date_time: 'nope' },
    ])
    const record = selectRecord(records, 'SP-EURC')
    expect(parseScore(record.ssa)).toBe(2)
    expect(parseTimestamp(record.last_modified_date_time)).toBe(1766102400000)
  })
})
