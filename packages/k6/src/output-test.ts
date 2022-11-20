import { RefinedResponse } from 'k6/http'
import { AssertionRequest, Assertion, AssertionResult, ExpectedResponse } from './config/types'

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

const matchRequest = (assertionRequest: AssertionRequest, request: Record<string, any>) => {
  const requestBody = JSON.stringify(JSON.parse(request.body).data)
  return (
    request.url.includes(assertionRequest.endpoint) &&
    (!assertionRequest.data || requestBody == JSON.stringify(assertionRequest.data))
  )
}

const assert = (body: any, expectedResponse: ExpectedResponse, request: any) => {
  const result: AssertionResult = { success: 0, fail: 0, output: [] }
  Object.keys(expectedResponse)
    .filter((key) => Object.keys(body).includes(key))
    .map((key) => {
      Object.entries(expectedResponse[key]).map((item) => {
        const [assertion, condition] = item
        if (assertValue(assertion, body[key], condition)) {
          result.success += 1
        } else {
          result.fail += 1
          result.output.push({
            assertion,
            key,
            output: body,
            request: { url: request.url, data: JSON.parse(request.body.toString()) },
          })
        }
      })
    })
  return result
}

export const validateOutput = (
  response: RefinedResponse<'text' | 'binary' | 'none'>,
  assertions: Assertion[],
) => {
  if (!response.body) {
    return
  }
  const body = JSON.parse(response.body.toString())
  console.log(`request: ${response.request.body} response: ${response.body}`)
  for (const assertion of assertions) {
    if (!matchRequest(assertion.request, response.request)) {
      continue
    }
    const result = assert(body, assertion.expectedResponse, response.request)
    if (result.output.length) {
      for (const output of result.output) {
        console.log(
          `Failed ${output.assertion} key:${output.key} output: ${JSON.stringify(
            output.output,
          )} request.data: ${JSON.stringify(output.request.data)}`,
        )
      }
    }
  }
}
