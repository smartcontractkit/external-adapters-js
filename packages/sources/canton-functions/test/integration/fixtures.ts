import nock from 'nock'
import mockCantonExerciseResponse from '../fixtures/canton-exercise-choice-response.json'

// New constants from manual test cases
const TEST_URL = 'http://127.0.0.1:7575'
export const TEST_TEMPLATE_ID =
  '07722379f6f533cd18ec65a44953e507a032b19fba17302c566ca191b569392f:Main:Asset'

// Helpers for building simple mock query results
const buildQueryResult = (contracts: any[]) => ({ result: contracts })

// Test case 1 and 2: Query by template without filter (returns two contracts, second is latest)
export function mockQueryByTemplateNoFilter() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/query', {
      templateIds: [TEST_TEMPLATE_ID],
    })
    .reply(
      200,
      buildQueryResult([
        {
          contractId: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff0001',
          templateId: TEST_TEMPLATE_ID,
          createdAt: '2025-10-16T12:00:00Z',
          payload: { name: 'Phone', value: 1500 },
          signatories: [],
          observers: [],
          agreementText: 'Agreement A',
        },
        {
          contractId: 'aabbccddeeff00112233445566778899aabbccddeeff001122334455667788990002',
          templateId: TEST_TEMPLATE_ID,
          createdAt: '2025-10-17T12:00:00Z',
          payload: { name: 'Laptop', value: 2500 },
          signatories: [],
          observers: [],
          agreementText: 'Agreement B',
        },
      ]),
    )
}

// Test case 4: Query with filter { name: 'Laptop' }
export function mockQueryWithNameFilter() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/query', {
      templateIds: [TEST_TEMPLATE_ID],
      query: { name: 'Laptop' },
    })
    .reply(
      200,
      buildQueryResult([
        {
          contractId: 'bbccddeeff00112233445566778899aabbccddeeff001122334455667788990003',
          templateId: TEST_TEMPLATE_ID,
          createdAt: '2025-10-18T12:00:00Z',
          payload: { name: 'Laptop', value: 3000 },
          signatories: [],
          observers: [],
          agreementText: 'Agreement C',
        },
      ]),
    )
}

// Exercise mocks
// Test case 1: exercise GetInfo on latest contract from no-filter query (second contract)
export function mockExerciseGetInfoOnLatestFromNoFilter() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: TEST_TEMPLATE_ID,
      contractId: 'aabbccddeeff00112233445566778899aabbccddeeff001122334455667788990002',
      choice: 'GetInfo',
      argument: {},
    })
    .reply(200, mockCantonExerciseResponse)
}

// Test case 2: exercise CheckValueAbove with argument on latest from no-filter query
export function mockExerciseCheckValueAboveOnLatestFromNoFilter() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: TEST_TEMPLATE_ID,
      contractId: 'aabbccddeeff00112233445566778899aabbccddeeff001122334455667788990002',
      choice: 'CheckValueAbove',
      argument: { threshold: 2000 },
    })
    .reply(200, mockCantonExerciseResponse)
}

// Test case 3: exercise CheckValueAbove with provided contract ID
export function mockExerciseCheckValueAboveWithProvidedId() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: TEST_TEMPLATE_ID,
      contractId:
        '0013102064814a98f87bb076314c6b82bdff97211e6cf8281c654d1b0df9c855e8ca03122027c21329e8823932596af34d936e7e25c69d28a1af118ba599732370266b589f',
      choice: 'CheckValueAbove',
      argument: { threshold: 2000 },
    })
    .reply(200, mockCantonExerciseResponse)
}

// Test case 4: exercise on the filtered contract (only one returned)
export function mockExerciseCheckValueAboveOnFilteredContract() {
  nock(TEST_URL, {
    reqheaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-jwt-token',
    },
  })
    .persist()
    .post('/v1/exercise', {
      templateId: TEST_TEMPLATE_ID,
      contractId: 'bbccddeeff00112233445566778899aabbccddeeff001122334455667788990003',
      choice: 'CheckValueAbove',
      argument: { threshold: 2000 },
    })
    .reply(200, mockCantonExerciseResponse)
}
