import { assert } from 'chai'
import { AdapterRequest } from '@chainlink/types'
import { AdapterError } from '@chainlink/ea-bootstrap'
import { assertSuccess } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../src'
import { PriceAdapter } from '../src/dataProvider'
import { Config } from '../src/config'

const result = 123

const scheduleAlwaysClosed = {
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
}

const adapter = (type: string): PriceAdapter => {
  if (type !== 'success') {
    return async (input: AdapterRequest) => {
      throw new AdapterError({ jobRunID: input.id })
    }
  }

  return async (input: AdapterRequest) => {
    return {
      jobRunID: input.id,
      statusCode: 200,
      data: { result },
      result,
    }
  }
}

const makeMockConfig = (): Config => {
  return {
    getPriceAdapter: adapter,
  }
}

describe('executeWithAdapters', () => {
  context('successful calls', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'successful adapter call',
        input: {
          id: jobID,
          data: {
            asset: 'FTSE',
            contract: '0x00',
            multiply: 1,
            source: 'success',
            check: 'schedule',
            schedule: {},
          },
        },
      },
      {
        name: 'trading halted, use meta data',
        input: {
          id: jobID,
          data: {
            asset: 'FTSE',
            contract: '0x00',
            multiply: 1,
            source: 'fails',
            check: 'schedule',
            schedule: scheduleAlwaysClosed,
          },
          meta: { latestAnswer: result },
        },
        halted: true,
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const execute = makeExecute(makeMockConfig())
        const data = await execute(req.input as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, result)
        assert.equal(data.data.result, result)
      })
    })
  })
})
