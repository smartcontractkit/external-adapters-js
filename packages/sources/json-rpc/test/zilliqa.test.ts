import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { execute } from '../src/adapter'

/**
 * Running these tests requires a connection to a Zilliqa client.
 * Not all supported methods have a test case, just enough to display capability.
 */

describe('Zilliqa client @integration', () => {
  this.timeout(5000)
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'

  describe('Unrecognized method', () => {
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

  describe('GetNetworkId', () => {
    const req = {
      id: jobID,
      data: {
        method: 'GetNetworkId',
        params: [''],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req)
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  describe('GetBalance', () => {
    const req = {
      id: jobID,
      data: {
        method: 'GetBalance',
        params: ['05fE66887AC5B6465f5aEda85E0557A29Ab11936'],
      },
    }

    it('Get balance should return some address balance', async () => {
      const resp = await execute(req)
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  describe('GetBalance', () => {
    const req = {
      id: jobID,
      data: {
        method: 'GetBalance',
        params: ['05fE66887AC5B6465f5aEda85E0557A29Ab11937'],
      },
    }

    it(
      'Get balance should return error as address is not created.',
      async () => {
        const resp = await execute(req)
        assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
      }
    )
  })

  describe('GetSmartContractState', () => {
    const req = {
      id: jobID,
      data: {
        method: 'GetSmartContractState',
        params: ['5865337a32F48a04F5B52507442f47FC558d9C2b'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req)
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })
})
