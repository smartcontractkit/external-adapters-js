import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { Config } from '../src/config'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            address: '0xf1e73a60687affcb1d6308fcb2ef1da3865ff797',
            data: '0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e70ae84788a565ad436a112ee40d236e6f95106e22bd45cd8b78c8fe8c93c4df0000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000603d9865000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
            topics: [
              '0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65',
              '0x3836643062336366366262313466306338633237363234316636383361363765'
            ],
            value: '{"jobRunID":"1","data":{"result":"1003904"},"result":"1003904"}'
          }
        },
      },
      {
        name: 'input',
        testData: {
          id: jobID,
          data: {
            address: '0xf1e73a60687affcb1d6308fcb2ef1da3865ff797',
            data: '0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e70ae84788a565ad436a112ee40d236e6f95106e22bd45cd8b78c8fe8c93c4df0000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000603d9865000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
            topics: [
              '0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65',
              '0x3836643062336366366262313466306338633237363234316636383361363765'
            ],
            value: '{"jobRunID":"1","data":{"result":"1003904"},"result":"1003904"}'
          }
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isAbove(data.result, 0)
        assert.isAbove(data.data.result, 0)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'address not supplied',
        testData: {
          id: jobID,
          data: {
            data: '0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e70ae84788a565ad436a112ee40d236e6f95106e22bd45cd8b78c8fe8c93c4df0000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000603d9865000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
            topics: [
              '0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65',
              '0x3836643062336366366262313466306338633237363234316636383361363765'
            ],
            value: '{"jobRunID":"1","data":{"result":"1003904"},"result":"1003904"}'
          }
        },
      },
      {
        name: 'data not supplied',
        testData: {
          id: jobID,
          data: {
            address: '0xf1e73a60687affcb1d6308fcb2ef1da3865ff797',
            topics: [
              '0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65',
              '0x3836643062336366366262313466306338633237363234316636383361363765'
            ],
            value: '{"jobRunID":"1","data":{"result":"1003904"},"result":"1003904"}'
          }
        },
      },
      {
        name: 'topics not supplied',
        testData: {
          id: jobID,
          data: {
            address: '0xf1e73a60687affcb1d6308fcb2ef1da3865ff797',
            data: '0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e70ae84788a565ad436a112ee40d236e6f95106e22bd45cd8b78c8fe8c93c4df0000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000603d9865000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
            value: '{"jobRunID":"1","data":{"result":"1003904"},"result":"1003904"}'
          }
        },
      },
      {
        name: 'value not supplied',
        testData: {
          id: jobID,
          data: {
            address: '0xf1e73a60687affcb1d6308fcb2ef1da3865ff797',
            data: '0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e70ae84788a565ad436a112ee40d236e6f95106e22bd45cd8b78c8fe8c93c4df0000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000603d9865000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
            topics: [
              '0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65',
              '0x3836643062336366366262313466306338633237363234316636383361363765'
            ]
          }
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

  // context('error calls @integration', () => {
  //   const requests = [
  //     {
  //       name: 'unknown base',
  //       testData: { id: jobID, data: { base: 'not_real', quote: 'USD' } },
  //     },
  //     {
  //       name: 'unknown quote',
  //       testData: { id: jobID, data: { base: 'ETH', quote: 'not_real' } },
  //     },
  //   ]

  //   requests.forEach((req) => {
  //     it(`${req.name}`, async () => {
  //       try {
  //         await execute(req.testData as AdapterRequest)
  //       } catch (error) {
  //         const errorResp = Requester.errored(jobID, error)
  //         assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
  //       }
  //     })
  //   })
  // })
})
