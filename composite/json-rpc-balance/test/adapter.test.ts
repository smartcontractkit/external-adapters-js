import { assert } from 'chai'
import { assertSuccess } from '@chainlink/adapter-test-helpers'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  context('successful calls @integration', () => {
    const jobID = 'abc123'

    const requests = [
      {
        name: 'gets balances successfully',
        input: {
          jobID,
          params: {
            addresses: {},
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const execute = makeExecute()
        const data = await execute(req.input)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.result, result)
        assert.equal(data.data.result, result)
      })
    })
  })
})
