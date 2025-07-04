import fs from 'fs'
import { MonitorPriceResponse, Utils } from '../../src/transport/netdania'

describe('PartialPriceUpdate', () => {
  let rawUpdates: MonitorPriceResponse[]

  // read from the raw-price-updates.jsonl file in the same directory
  beforeAll(async () => {
    // load the raw updates jsonl file into a rawUpdates
    rawUpdates = (await fs.promises.readFile(__dirname + '/raw-price-updates.jsonl', 'utf-8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        return JSON.parse(line) as MonitorPriceResponse
      })
  })

  it('must parse all the correct updates correctly', async () => {
    for (const update of rawUpdates) {
      console.debug(`Parsing update: ${JSON.stringify(update)}`)
      const ppu = Utils.mkPartialPriceUpdate(update)
      expect(ppu).toBeDefined()
    }
  })

  it('must parse this correctly', async () => {
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
    expect(() => Utils.mkPartialPriceUpdate(update)).toThrow('Not a price response, type is 1, expected 2.')
  })

  // it('every update merged with the history for its instrument yields a valid price', async () => {})
  // it('must not parse any incorrect updates', async () => {})
  // it('must parse all the updates quickly', async () => {})
})
