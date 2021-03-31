import { Requester } from '@chainlink/ea-bootstrap'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'matches',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      }).timeout(30000)
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'lat not supplied',
        testData: {
          id: jobID,
          data: {
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'lng not supplied',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            radius: '500000',
            start: '2021-01-01 20:00:00',
            end: '2021-02-21 20:30:00',
          },
        },
      },
      {
        name: 'radius not supplied',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            start: '2021-01-01 20:00:00',
            end: '2021-02-21 20:30:00',
          },
        },
      },
      {
        name: 'start not supplied',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            end: '2021-02-21 20:30:00',
          },
        },
      },
      {
        name: 'end not supplied',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 20:00:00',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'invalid lat',
        testData: {
          id: jobID,
          data: {
            lat: '100',
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'invalid lng',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '200',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'invalid radius',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '-100',
            start: '2021-01-01 00:00:00',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'invalid start',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            start: 'invalid_time',
            end: '2021-02-21 02:30:00',
          },
        },
      },
      {
        name: 'invalid end',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            start: '2021-01-01 00:00:00',
            end: 'invalid_time',
          },
        },
      },
      {
        name: 'end < start',
        testData: {
          id: jobID,
          data: {
            lat: '45.7905',
            lng: '11.9202',
            radius: '500000',
            end: '2021-01-01 00:00:00',
            start: '2021-02-21 02:30:00',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      }).timeout(30000)
    })
  })
})
