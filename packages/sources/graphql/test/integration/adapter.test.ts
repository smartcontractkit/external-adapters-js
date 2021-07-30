import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'request with no variables',
        testData: { 
          id: jobID,
          data: {
           "query":"{\n  markets(first: 1) {\n    borrowRate\n    cash\n    collateralFactor\n    exchangeRate\n    interestRateModelAddress\n    name\n    reserves\n    supplyRate\n    symbol\n    id\n    totalBorrows\n    totalSupply\n    underlyingAddress\n    underlyingName\n    underlyingPrice\n    underlyingSymbol\n    reserveFactor\n    underlyingPriceUSD\n  }\n}\n",
           "variables": null,
           "graphqlEndpoint": "https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2" 
          } 
        },
      },
      {
        name: 'request with variables',
        testData: { 
          id: jobID, 
          data: { 
            "query":"query($first: Int){\n  markets(first: $first) {\n    borrowRate\n    cash\n    collateralFactor\n    exchangeRate\n    interestRateModelAddress\n    name\n    reserves\n    supplyRate\n    symbol\n    id\n    totalBorrows\n    totalSupply\n    underlyingAddress\n    underlyingName\n    underlyingPrice\n    underlyingSymbol\n    reserveFactor\n    underlyingPriceUSD\n  }\n}\n",
            "variables": {
                "first": 1
            },
            "graphqlEndpoint": "https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2"
          } 
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).not.toBeNull()
        expect(data.data.result).not.toBeNull()
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'corrupt graphQL endpoint',
        testData: { 
          id: jobID, 
          data: { 
            "query":"query($first: Int){\n  markets(first: $first) {\n    borrowRate\n    cash\n    collateralFactor\n    exchangeRate\n    interestRateModelAddress\n    name\n    reserves\n    supplyRate\n    symbol\n    id\n    totalBorrows\n    totalSupply\n    underlyingAddress\n    underlyingName\n    underlyingPrice\n    underlyingSymbol\n    reserveFactor\n    underlyingPriceUSD\n  }\n}\n",
            "variables": {
                "first": 1
            },
            "graphqlEndpoint": "corrupt-endpoint"
          } 
        },
      },
      {
        name: 'corrupt graphQL query',
        testData: { 
          id: jobID, 
          data: { 
            "query":"corrupt query",
            "variables": {
                "first": 1
            },
            "graphqlEndpoint": "corrupt-endpoint"
          } 
        },
      },
      {
        name: 'request with missing variable',
        testData: { 
          id: jobID, 
          data: { 
            "query":"query($first: Int){\n  markets(first: $first) {\n    borrowRate\n    cash\n    collateralFactor\n    exchangeRate\n    interestRateModelAddress\n    name\n    reserves\n    supplyRate\n    symbol\n    id\n    totalBorrows\n    totalSupply\n    underlyingAddress\n    underlyingName\n    underlyingPrice\n    underlyingSymbol\n    reserveFactor\n    underlyingPriceUSD\n  }\n}\n",
            "variables": null,
            "graphqlEndpoint": "https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2"
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
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
