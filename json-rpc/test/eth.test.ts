import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { execute } from '../src/adapter'

/**
 * Running these tests requires a connection to an Ethereum (or equivalent) client.
 * Not all supported methods have a test case, just enough to display capability.
 */

describe('Ethereum client @integration', async function () {
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
      const resp = await execute(req, {})
      assertError({ expected: 500, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getBalance', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getBalance',
        params: ['0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab', 'latest'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_syncing', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_syncing',
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_gasPrice', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_gasPrice',
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_blockNumber', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_blockNumber',
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getBalance', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getBalance',
        params: ['0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab', 'latest'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getStorageAt', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getStorageAt',
        params: ['0x51DE85B0cD5B3684865ECfEedfBAF12777cd0Ff8', '0x0', 'latest'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_call', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_call',
        params: [
          {
            to: '0x51DE85B0cD5B3684865ECfEedfBAF12777cd0Ff8',
            data: '0x8da5cb5b',
          },
          'latest',
        ],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getTransactionByHash', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getTransactionByHash',
        params: ['0xc0b989396d78277feb0a28de303652bc2c0b23f3f6fe76f67ff248ed481254f4'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getTransactionReceipt', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getTransactionReceipt',
        params: ['0xc0b989396d78277feb0a28de303652bc2c0b23f3f6fe76f67ff248ed481254f4'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  /**
   * These functions only work with a connection to an unlocked client and have been
   * disabled for the standard test suite.
   */

  context('eth_sign', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_sign',
        params: ['0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab', '0x54686973206973206120746573742E'],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_getProof', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_getProof',
        params: [
          '0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab',
          [
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          ],
          'latest',
        ],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_sendTransaction', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab',
            to: '0x87002564f1c7b8f51e96ca7d545e43402bf0b4ab',
            data: '0x54686973206973206120746573742E',
          },
        ],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })

  context('eth_sendRawTransaction', () => {
    const req = {
      id: jobID,
      data: {
        method: 'eth_sendRawTransaction',
        params: [
          '0xf87582065c85012a05f2008284d09487002564f1c7b8f51e96ca7d545e43402bf0b4ab808f54686973206973206120746573742e29a01ee35bf6feecdd2597d578c656bac327e4aace48270bbc2fcbf8ed63f1232dcca0113e7131a2e133fd014a33f2de985914ad0eb98a594e20a132b559ec94716da4',
        ],
      },
    }

    it('returns data to the node', async () => {
      const resp = await execute(req, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp.data, jobID)
    })
  })
})
