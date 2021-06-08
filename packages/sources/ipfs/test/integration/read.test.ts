import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../../src/method/read'
import { makeConfig } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  const config = makeConfig()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { cid: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A' } },
      },
      {
        name: 'simple cid',
        testData: { id: jobID, data: { cid: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A' } },
      },
      {
        name: 'custom cid',
        testData: { id: jobID, data: { cid: 'QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf' } },
      },
      {
        name: 'custom cid with codec',
        testData: {
          id: jobID,
          data: { cid: 'QmWFam9NBVVhz3fViSbxjB7utkkjDSmdWWBbbSTkK8kaxk', codec: 'dag-cbor' },
        },
      },
      {
        name: 'custom cid with codec and link',
        testData: {
          id: jobID,
          data: { cid: 'QmPua9o8uxszLfcZfuTftssmzZspci9P8Ys9cvY3xsonDr', codec: 'dag-cbor' },
        },
      },
      {
        name: 'ipns resolution',
        testData: {
          id: jobID,
          data: { ipns: 'k51qzi5uqu5dlkb9yviadsfl3uxndbkyhf4n97u1t1np5e9f67zwmjz6yk9m9k' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, config)
        console.log(data)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown cid',
        testData: { id: jobID, data: { cid: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, config)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
