import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

const geoJsonPolygon = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [5.2796173095703125, 60.40673218057448],
            [5.164947509765625, 60.383665698324926],
            [5.17730712890625, 60.211509994185604],
            [5.401153564453124, 60.27694067255946],
            [5.6188201904296875, 60.436558668419984],
            [5.526123046875, 60.42842688461354],
            [5.3002166748046875, 60.5387098888639],
            [5.238418579101562, 60.4951151199491],
            [5.2796173095703125, 60.40673218057448],
          ],
        ],
      },
    },
  ],
}
const geoJsonPoint = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [5.325622558593749, 60.3887552979679] },
    },
  ],
}

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            geoJson: geoJsonPolygon,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'AVG',
            column: 'temp',
          },
        },
      },
      {
        name: 'AVG(temp) Polygon',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPolygon,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'AVG',
            column: 'temp',
          },
        },
      },
      {
        name: 'AVG(temp) Point',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'AVG',
            column: 'temp',
          },
        },
      },
      {
        name: 'SUM(thunder) Polygon',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPolygon,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'SUM',
            column: 'thunder',
          },
        },
      },
      {
        name: 'works with full ISO 8601 date format',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01T11:04:49Z',
            dateTo: '2021-04-20T11:04:49Z',
            method: 'AVG',
            column: 'temp',
          },
        },
      },
      {
        name: 'converts imperial to metric',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01T11:04:49Z',
            dateTo: '2021-04-20T11:04:49Z',
            method: 'AVG',
            column: 'temp',
            units: 'metric',
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
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'geoJson not supplied',
        testData: {
          id: jobID,
          data: {
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'SUM',
            column: 'thunder',
          },
        },
      },
      {
        name: 'dateFrom not supplied',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateTo: '2021-05-01',
            method: 'SUM',
            column: 'thunder',
          },
        },
      },
      {
        name: 'dateTo not supplied',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            method: 'SUM',
            column: 'thunder',
          },
        },
      },
      {
        name: 'method not supplied',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            column: 'thunder',
          },
        },
      },
      {
        name: 'column not supplied',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'SUM',
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
        name: 'unknown method',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'DOES_NOT_EXIST',
            column: 'thunder',
          },
        },
      },
      {
        name: 'invalid GeoJSON',
        testData: {
          id: jobID,
          data: {
            geoJson: {},
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'DOES_NOT_EXIST',
            column: 'thunder',
          },
        },
      },
      {
        name: 'unknown column',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '2021-04-01',
            dateTo: '2021-05-01',
            method: 'SUM',
            column: 'DOES_NOT_EXIST',
          },
        },
      },
      {
        name: 'invalid date format',
        testData: {
          id: jobID,
          data: {
            geoJson: geoJsonPoint,
            dateFrom: '20210401',
            dateTo: '20210501',
            method: 'SUM',
            column: 'thunder',
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
      })
    })
  })
})
