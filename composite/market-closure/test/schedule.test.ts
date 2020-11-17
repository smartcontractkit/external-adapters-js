import { assert } from 'chai'
import { isMarketClosed } from '../src/checks/schedule'
import { Schedule } from 'market-closure'

describe('isMarketClosed', () => {
  context('successful calls', () => {
    const requests = [
      {
        name: 'empty schedule',
        schedule: {},
        expect: false,
      },
      {
        name: 'full schedule',
        schedule: {
          timezone: 'Europe/Oslo',
          hours: {
            monday: ['00:00-24:00'],
            tuesday: ['00:00-24:00'],
            wednesday: ['00:00-24:00'],
            thursday: ['00:00-24:00'],
            friday: ['00:00-24:00'],
            saturday: ['00:00-24:00'],
            sunday: ['00:00-24:00'],
          },
          holidays: [
            {
              year: 2020,
              month: 5,
              day: 8,
              hours: '24:00-24:01',
            },
          ],
        },
        expect: false,
      },
      {
        name: 'full schedule always closed',
        schedule: {
          timezone: 'Europe/Oslo',
          hours: {
            monday: ['24:00-24:01'],
            tuesday: ['24:00-24:01'],
            wednesday: ['24:00-24:01'],
            thursday: ['24:00-24:01'],
            friday: ['24:00-24:01'],
            saturday: ['24:00-24:01'],
            sunday: ['24:00-24:01'],
          },
          holidays: [],
        },
        expect: true,
      },
      {
        name: 'empty schedule always open',
        schedule: {
          timezone: 'Europe/Oslo',
          hours: {},
          holidays: [],
        },
        expect: false,
      },
      {
        name: 'always empty with hours set',
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
      it(`${req.name}`, () => {
        const halted = isMarketClosed({ id: '1', data: { schedule: req.schedule as Schedule } })
        assert.equal(halted, req.expect)
      })
    })
  })

  context('failing calls', () => {
    const requests = [
      {
        name: 'missing timezone',
        schedule: {
          timezone: '',
          hours: {
            monday: ['00:00-24:00'],
            tuesday: ['00:00-24:00'],
            wednesday: ['00:00-24:00'],
            thursday: ['00:00-24:00'],
            friday: ['00:00-24:00'],
            saturday: ['00:00-24:00'],
            sunday: ['00:00-24:00'],
          },
          holidays: [],
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        assert.throw(() => isMarketClosed({ id: '1', data: { schedule: req.schedule as Schedule } }), Error)
      })
    })
  })
})
