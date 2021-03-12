import { assert } from 'chai'
import { isMarketClosed } from '../src/checks/schedule'
import { rejects } from 'assert'
import { AdapterRequest } from '@chainlink/types'

describe('isMarketClosed Schedule', () => {
  context('successful calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'empty schedule',
        input: { id: jobID, data: { schedule: {} } },
        expect: false,
      },
      {
        name: 'full schedule',
        input: {
          id: jobID,
          data: {
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
          },
        },
        expect: false,
      },
      {
        name: 'full schedule always closed',
        input: {
          id: jobID,
          data: {
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
          },
        },
        expect: true,
      },
      {
        name: 'empty schedule always open',
        input: {
          id: jobID,
          data: {
            schedule: {
              timezone: 'Europe/Oslo',
              hours: {},
              holidays: [],
            },
          },
        },
        expect: false,
      },
      {
        name: 'always empty with hours set',
        input: {
          id: jobID,
          data: {
            schedule: {
              timezone: 'Europe/Oslo',
              hours: {
                monday: ['24:00-24:01'],
              },
              holidays: [],
            },
          },
        },
        expect: true,
      },
    ]

    for (const req of requests) {
      it(`${req.name}`, async () => {
        const halted = await isMarketClosed(req.input as AdapterRequest)
        assert.equal(halted, req.expect)
      })
    }
  })

  context('failing calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'missing timezone',
        input: {
          id: jobID,
          data: {
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
        },
      },
    ]

    for (const req of requests) {
      it(`${req.name}`, async () => {
        await rejects(isMarketClosed(req.input as AdapterRequest))
      })
    }
  })
})
