import { assert } from 'chai'
import { checkWithSchedule, ExternalCheck } from '../src/checks'
import { Schedule } from 'market-closure'

const check = (halted: boolean, fail = false): ExternalCheck => fail ? Promise.error(new Error()) : Promise.resolve(halted)

describe('checkWithSchedule', () => {
  context('successful calls', () => {
    const requests = [
      {
        name: 'successful check open',
        check: checkWithSchedule(check(false)),
        symbol: 'FTSE',
        schedule: {},
        expect: false,
      },
      {
        name: 'successful check halted',
        check: checkWithSchedule(check(true)),
        symbol: 'FTSE',
        schedule: {},
        expect: true,
      },
      {
        name: 'on fail falls back to empty schedule',
        check: checkWithSchedule(check(true, true)),
        symbol: 'FTSE',
        schedule: {},
        expect: false,
      },
      {
        name: 'on fail falls back to filled schedule',
        check: checkWithSchedule(check(false, true)),
        symbol: 'FTSE',
        schedule: {
          timezone: 'Europe/Oslo',
          hours: {
            monday: ['24:00-24:01'],
          },
          holidays: [],
        },
        expect: true,
      },
      {
        name: 'on empty check falls back to empty schedule',
        check: checkWithSchedule(),
        symbol: 'FTSE',
        schedule: {},
        expect: false,
      },
      {
        name: 'on empty falls back to filled schedule',
        check: checkWithSchedule(),
        symbol: 'FTSE',
        schedule: {
          timezone: 'Europe/Oslo',
          hours: {
            monday: ['24:00-24:01'],
          },
          holidays: [],
        },
        expect: true,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const halted = await req.check(req.symbol, req.schedule as Schedule)
        assert.equal(halted, req.expect)
      })
    })
  })
})
