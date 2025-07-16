import fs from 'fs'
import { MonitorPriceResponse, Utils } from '../../src/transport/netdania'

describe('PartialPriceUpdate', () => {
  it('must parse all the correct updates correctly', async () => {
    const rawUpdates = (await fs.promises.readFile(__dirname + '/raw-price-updates.jsonl', 'utf-8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        return JSON.parse(line) as MonitorPriceResponse
      })
    for (const update of rawUpdates) {
      console.debug(`Parsing update: ${JSON.stringify(update)}`)
      const ppu = Utils.mkPartialPriceUpdate(update)
      expect(ppu).toBeDefined()
    }
  })

  it('must parse a valid update correctly', async () => {
    const update: MonitorPriceResponse = {
      type: 2,
      id: 6,
      data: [
        { f: 11, v: '1296.5' },
        { f: 3015, v: '1750333500165' },
        { f: 10, v: '1291.5' },
        {
          f: 152,
          v: '1750333500165',
        },
        { f: 9, v: '1294' },
        { f: 3013, v: '1750333500165' },
      ],
      modifiedFids: [11, 3015, 10, 152, 9, 3013],
    }

    const ppu = Utils.mkPartialPriceUpdate(update)
    expect(ppu).toBeDefined()
  })

  it('must throw on invalid updates', () => {
    const update: MonitorPriceResponse = {
      type: 1, // otherwise valid
      id: 6,
      data: [
        { f: 11, v: '1296.5' },
        { f: 3015, v: '1750333500165' },
        { f: 10, v: '1291.5' },
        {
          f: 152,
          v: '1750333500165',
        },
        { f: 9, v: '1294' },
        { f: 3013, v: '1750333500165' },
      ],
      modifiedFids: [11, 3015, 10, 152, 9, 3013],
    }
    expect(() => Utils.mkPartialPriceUpdate(update)).toThrow(
      'Not a price response, type is 1, expected 2.',
    )
  })

  it('must sanitize a full url by idempotently redacting the h parameter', () => {
    expect(Utils.sanitize('https://example.com/path?h=12345&otherParam=value&cb=?')).toBe(
      'https://example.com/path?h=redacted&otherParam=value&cb=?',
    )

    const urlWithoutH = 'https://example.com/path?sessid=UP12345&otherParam=value'
    expect(Utils.sanitize(urlWithoutH)).toBe(urlWithoutH)
  })

  it('must sanitize a partial url by idempotently redacting the h parameter', () => {
    expect(
      Utils.sanitize(
        '?xstream=1&v=5&dt=0&h=eyJnIjoiY2hhaW4ubGluayIsImFpIjoiTm9kZUpTQVBJdjEuNS4yIiwicHIiOjIsImF1IjoibG9jYWxob3N0OjgwODAiLCJxdXAiOjEsInAiOiJmYWtlLWFwaS1rZXkifQ..&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000',
      ),
    ).toBe(
      '?xstream=1&v=5&dt=0&h=redacted&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000',
    )

    const urlWithoutH =
      '?xstream=1&v=5&dt=0&xcmd=W3sidCI6MSwiaSI6MSwibSI6MSwicyI6IkVVUlVTRCIsInAiOiJpZGMifV0.&cb=?&ts=1752653143000'
    expect(Utils.sanitize(urlWithoutH)).toBe(urlWithoutH)
  })
})
