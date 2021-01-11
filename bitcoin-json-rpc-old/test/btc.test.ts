import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { execute } from '../src/adapter'

/**
 * Running these tests requires a connection to a Bitcoin client.
 * Not all supported methods have a test case, just enough to display capability.
 */

describe('Bitcoin client @integration', function () {
  this.timeout(5000)
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'

  context('Unrecognized method', () => {
    const req = {
      id: jobID,
      data: {
        method: 'no_op',
      },
    }

    it('returns error to the node', async () => {
      const resp = await execute(req)
      assertError({ expected: 500, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('getblockchaininfo', () => {
    const req = {
      id: jobID,
      data: {
        method: 'getblockchaininfo',
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req)
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('get height of btc blockchain', () => {
    const req = {
      id: jobID,
      data: {
        blockchain: 'btc',
        q: 'height',
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req)
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })
})
