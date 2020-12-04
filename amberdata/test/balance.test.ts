import { makeExecute } from '../src/adapter'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/adapter-test-helpers'

shouldBehaveLikeBalanceAdapter(makeExecute(), ['bitcoinmainnet'])

// import { assert } from 'chai'
// import { Requester, assertSuccess, assertError, AdapterError } from '@chainlink/external-adapter'
// import { AdapterRequest } from '@chainlink/types'
// import { executeWithDefaults } from '../src/adapter'

// describe('balance endpoint', () => {
//   const jobID = '1'

//   context('successful calls @integration', () => {
//     const requests = [
//       {
//         name: 'id not supplied',
//         testData: {
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'BTC mainnet',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
//               },
//               {
//                 address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
//               },
//               {
//                 address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
//               },
//               {
//                 address: '3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT',
//               },
//               {
//                 address: '3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth',
//               },
//               {
//                 address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'ETH testnet',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 coin: 'eth',
//                 chain: 'testnet',
//                 address: '0x664EEe181C2d65619F367c5AaC7d42F571B61177',
//               },
//             ],
//           },
//         },
//       },
//     ]

//     requests.forEach((req) => {
//       it(`${req.name}`, async () => {
//         const data = await executeWithDefaults(req.testData as AdapterRequest)
//         const numAddr = req?.testData?.data?.addresses.length
//         assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
//         assert.isAbove(Number(data.data.result.length), 0)
//         assert.isAbove(Number(data.result.length), 0)
//         assert.equal(Number(data.data.result.length), numAddr)
//         assert.equal(Number(data.result.length), numAddr)
//       })
//     })
//   })

//   context('validation error', () => {
//     const requests = [
//       { name: 'empty body', testData: {} },
//       {
//         name: 'empty addresses',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [],
//           },
//         },
//       },
//       {
//         name: 'unknown endpoint',
//         testData: {
//           id: jobID,
//           data: {
//             endpoint: 'not_real',
//             addresses: [
//               {
//                 address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'invalid dataPath',
//         testData: {
//           id: jobID,
//           data: {
//             endpoint: 'balance',
//             dataPath: 'not_real',
//             addresses: [
//               {
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//               },
//             ],
//           },
//         },
//       },
//     ]

//     requests.forEach((req) => {
//       it(`${req.name}`, async () => {
//         try {
//           await executeWithDefaults(req.testData as AdapterRequest)
//         } catch (error) {
//           const errorResp = Requester.errored(jobID, new AdapterError(error))
//           assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
//         }
//       })
//     })
//   })

//   context('error calls @integration', () => {
//     const requests = [
//       {
//         name: 'invalid address',
//         testData: {
//           id: jobID,
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'invalid confirmations',
//         testData: {
//           id: jobID,
//           data: {
//             endpoint: 'balance',
//             confirmations: null,
//             addresses: [
//               {
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'invalid chain',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//                 chain: 'not_real',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'invalid coin',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//                 coin: 'not_real',
//               },
//             ],
//           },
//         },
//       },
//       {
//         name: 'Non-ETH testnet',
//         testData: {
//           id: '1',
//           data: {
//             endpoint: 'balance',
//             addresses: [
//               {
//                 coin: 'btc',
//                 chain: 'testnet',
//                 address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
//               },
//             ],
//           },
//         },
//       },
//     ]

//     requests.forEach((req) => {
//       it(`${req.name}`, async () => {
//         try {
//           await executeWithDefaults(req.testData as AdapterRequest)
//         } catch (error) {
//           const errorResp = Requester.errored(jobID, new AdapterError(error))
//           assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
//         }
//       })
//     })
//   })
// })
