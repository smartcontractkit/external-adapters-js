import nock from 'nock'
import mockCantonResponse from '../fixtures/canton-query-contracts-response.json'

export function mockCantonApiResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/query', {
      templateIds: ['example-package-id:Main:Asset'],
    })
    .reply(200, mockCantonResponse)
}

export function mockCantonApiErrorResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/query', {
      templateIds: ['invalid-template-id'],
    })
    .reply(400, {
      error: 'Invalid template ID format',
    })
}
