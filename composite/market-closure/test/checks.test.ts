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
        expectError: false,
      },
      {
        name: 'successful check schedule',
        check: CheckProvider.Schedule,
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
        expectError: false,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        assert.doesNotThrow(await getCheckImpl(req.check, req.input))
      })
    })
  })
})
