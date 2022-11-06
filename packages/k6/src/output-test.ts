import fs from 'fs'
import { BatchRequests, BatchResponses } from 'k6/http'

/**
 * Example of assertion:
 {
    "request": {"endpoint": "/crypto", "data": { "base": "ETH", "quote": "USD" }},
    "expectedResponse": {
        "result": {"greaterThan": 0, "minPrecision": 10}
    }
} 
Assertions are in loaded from {pathToAdapterPackage}/output-assertions.json
*/
type ExpectedResponse = Record<string, Record<string, string | number>>

type Assertion = {
  request: AssertionRequest
  expectedResponse: ExpectedResponse
}

type AssertionRequest = {
  endpoint: string
  data: any
}

type AssertionResult = {
  success: 0
  fail: 0
  output: Array<{ assertion: string; key: string; output: any }>
}

const assertValue = (assertionName: string, value: number, condition: number | string) => {
  switch (assertionName) {
    case 'greaterThan': {
      return value > condition
    }
    case 'minPrecision': {
      const s = value.toString()
      if (s.indexOf('.') == -1) {
        return condition == 0
      }
      return s.length - s.indexOf('.') - 1 >= condition
    }
    case 'lessThan': {
      return value < condition
    }
    default:
      return false
  }
}

const getPathToAdapter = (adapterName: string) => {
  let pathToAdapter = ''
  const adapterTypes = ['sources', 'composites', 'targets']
  for (const type of adapterTypes) {
    const path = `packages/${type}/${adapterName}`
    if (fs.existsSync(path)) {
      pathToAdapter = path
      break
    }
  }
  return pathToAdapter
}

const loadOutputAssertions = (adapterName: string) => {
  const assertionsPath = getPathToAdapter(adapterName) + '/output-assertions.json'
  if (fs.existsSync(assertionsPath)) {
    return JSON.parse(fs.readFileSync(assertionsPath, 'utf-8'))
  }
  return []
}

const matchRequest = (assertionRequest: AssertionRequest, request: Record<string, any>) => {
  return request.url.includes(assertionRequest.endpoint)
}

const assert = (body: any, expectedResponse: ExpectedResponse) => {
  const result: AssertionResult = { success: 0, fail: 0, output: [] }
  Object.keys(expectedResponse)
    .filter((key) => key in body)
    .map((key) => {
      Object.entries(expectedResponse[key].assertions).map((item) => {
        const [assertion, condition] = item
        if (assertValue(assertion, body[key], condition)) {
          result.success += 1
        } else {
          result.fail += 1
          result.output.push({ assertion, key, output: body })
        }
      })
    })
  return result
}

export const validateOutputs = (responses: BatchResponses<BatchRequests>, adapterName: string) => {
  const assertions: Assertion[] = loadOutputAssertions(adapterName)
  const assertionResults: AssertionResult = { success: 0, fail: 0, output: [] }
  for (const [_, response] of Object.entries(responses)) {
    if (!response.body) {
      continue
    }
    const body = JSON.parse(response.body.toString())
    for (const assertion of assertions) {
      if (!matchRequest(assertion.request, response.request)) {
        continue
      }
      const result = assert(body, assertion.expectedResponse)
      assertionResults.success += result.success
      assertionResults.fail += result.fail
      assertionResults.output = assertionResults.output.concat(result.output)
    }
  }

  if (assertionResults.output.length) {
    const assertionsContent = assertionResults.output
      .map((output) => JSON.stringify(output))
      .join('\n')
    fs.writeFileSync(`~/output-${adapterName}-assertions`, assertionsContent, { flag: 'a+' })
  }

  const outputContent = Object.values(responses)
    .filter((response) => response.body)
    .map(
      (response) =>
        `${response.request.url} ${response.request.body.toString()}\n${response.body?.toString()}`,
    )
    .join('\n')
  fs.writeFileSync(`~/output-${adapterName}-raw`, outputContent, { flag: 'a' })
}
