import nock from 'nock'
import mockCantonExerciseResponse from '../fixtures/canton-exercise-choice-response.json'
import mockCantonQueryByIdResponse from '../fixtures/canton-query-by-id-response.json'
import mockCantonQueryResponse from '../fixtures/canton-query-contracts-response.json'
import mockCantonQueryWithFilterResponse from '../fixtures/canton-query-with-filter-response.json'

export function mockCantonApiQueryByTemplateResponse() {
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
    .reply(200, mockCantonQueryResponse)
}

export function mockCantonApiQueryByIdResponse() {
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
    .reply(200, mockCantonQueryByIdResponse)
}

export function mockCantonApiExerciseChoiceResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: 'example-package-id:Main:Asset',
      contractId: '00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0',
      choice: 'GetValue',
    })
    .reply(200, mockCantonExerciseResponse)
}

export function mockCantonApiExerciseChoiceWithArgumentResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: 'example-package-id:Main:Asset',
      contractId: '00e1f5c6d8b9a7f4e3c2d1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0',
      choice: 'UpdateValue',
      argument: { newValue: 2000 },
    })
    .reply(200, mockCantonExerciseResponse)
}

export function mockCantonApiQueryWithFilterResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/query', {
      templateIds: ['example-package-id:Main:Asset'],
      query: { owner: 'Bob' },
    })
    .reply(200, mockCantonQueryWithFilterResponse)
}

export function mockCantonApiExerciseChoiceOnLatestContractResponse() {
  nock('http://localhost:7575', {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: 'example-package-id:Main:Asset',
      contractId: '33b4c8d9e1c2b0a7f6e5d4c3b2d1e0a9f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3',
      choice: 'GetValue',
    })
    .reply(200, mockCantonExerciseResponse)
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
