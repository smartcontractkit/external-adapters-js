import { assert } from 'chai'
import { createRequest } from '../index'

describe('createRequest', () => {
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
  const bytes32FuncId = '0xc2b12a73'
  const int256FuncId = '0xa53b1c1e'
  const uint256FuncId = '0xd2282dc5'

  context('when writing to a contract without specifying the data type', () => {
    const req = {
      id: jobID,
      data: {
        exAddr: process.env.CONTRACT_ADDRESS,
        funcId: uint256FuncId,
        result: '54',
      },
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode: any, data: any) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        done()
      })
    })
  })

  context('when writing to a contract by specifying uint256', () => {
    const req = {
      id: jobID,
      data: {
        exAddr: process.env.CONTRACT_ADDRESS,
        dataType: 'uint256',
        funcId: uint256FuncId,
        result: 42,
      },
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode: any, data: any) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        done()
      })
    })
  })

  context('when writing to a contract by specifying bytes32', () => {
    const req = {
      id: jobID,
      data: {
        exAddr: process.env.CONTRACT_ADDRESS,
        dataType: 'bytes32',
        funcId: bytes32FuncId,
        result: 'hello there',
      },
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode: any, data: any) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        done()
      })
    })
  })

  context('when writing to a contract by specifying int256', () => {
    const req = {
      id: jobID,
      data: {
        exAddr: process.env.CONTRACT_ADDRESS,
        dataType: 'int256',
        funcId: int256FuncId,
        result: -42,
      },
    }

    it('returns data to the node', (done) => {
      createRequest(req, (statusCode: any, data: any) => {
        assert.equal(statusCode, 200)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
        done()
      })
    })
  })
})
