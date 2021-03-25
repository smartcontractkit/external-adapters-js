import { assert } from 'chai'
import { CheckProvider, getCheckImpl } from '../src/checks'

describe('checkWithSchedule', () => {
  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'successful check tradinghours',
        check: CheckProvider.TradingHours,
        input: {
          id: '1',
          data: {
            symbol: 'FTSE',
            schedule: {
              timezone: 'Europe/Oslo',
              hours: {
                monday: ['24:00-24:01'],
              },
              holidays: [],
            },
          },
        },
      },
      {
        name: 'successful check schedule',
        check: CheckProvider.Schedule,
        input: {
          id: '2',
          data: {
            symbol: 'FTSE',
            schedule: {
              timezone: 'Europe/Oslo',
              hours: {
                monday: ['24:00-24:01'],
              },
              holidays: [],
            },
          },
        },
      },
      {
        name: 'tradinghours then fall back to schedule',
        check: CheckProvider.TradingHours,
        input: {
          id: '3',
          data: {
            symbol: 'does_not_exist',
            schedule: {
              timezone: 'Europe/Oslo',
              hours: {
                monday: ['24:00-24:01'],
              },
              holidays: [],
            },
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const check = getCheckImpl(req.check)
        assert.isBoolean(await check(req.input))
      })
    })
  })
})
