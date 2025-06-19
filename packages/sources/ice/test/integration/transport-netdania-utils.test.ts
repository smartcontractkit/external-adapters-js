import fs from 'fs'
import { MonitorPriceResponse, Utils } from '../../src/transport/netdania'

describe('streaming client utils', () => {
  let rawUpdates: MonitorPriceResponse[]

  // read from the raw-price-updates.jsonl file in the same directory
  beforeAll(async () => {
    // load the raw updates jsonl file into a rawUpdates
    rawUpdates = (await fs.promises.readFile(__dirname + '/raw-price-updates.jsonl', 'utf-8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        return new MonitorPriceResponse(JSON.parse(line))
      })
  })

  it('must parse all the correct updates correctly', async () => {
    for (const update of rawUpdates) {
      console.debug(`Parsing update: ${JSON.stringify(update)}`)
      const ppu = Utils.toPartialPriceUpdate(update)
      if (ppu !== null) {
        expect(ppu.ts).toBeDefined()
      }
    }
  })

  // it('must not parse any incorrect updates', async () => {})
  // it('must parse all the updates quickly', async () => {})
})
