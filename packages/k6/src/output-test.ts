import { RefinedResponse } from 'k6/http'
import { AssertionRequest, Assertion, AssertionResult, ExpectedResponse } from './config/types'

const assertValue = (
  assertionName: string,
  value: number | Array<string | number> | string,
  condition: number | string,
) => {
  switch (typeof value) {
    case 'number': {
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
    case 'string': {
      switch (assertionName) {
        case 'hasFormat': {
          switch (condition) {
            case 'hex': {
              return !!value.match(/^(0x)?[0-9a-fA-F]+$/)
            }
            default:
              return false
          }
        }
        default:
          return false
      }
    }
    default: {
      switch (assertionName) {
        case 'minItems': {
          return Array.isArray(value) && value.length <= condition
        }
        case 'contains': {
          return Array.isArray(value) && value.includes(condition)
        }
        case 'hasKey': {
          return Object.keys(value).includes(String(condition))
        }
        default:
          return false
      }
    }
  }
}

const matchRequest = (assertionRequest: AssertionRequest, requestBody: any) => {
  const assertionRequestData = assertionRequest.data || assertionRequest
  const requestData = requestBody.data.data || requestBody.data
  return Object.entries(assertionRequestData).every((entry) => requestData[entry[0]] == entry[1])
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
  const requestBody = JSON.parse(response.request.body)
  console.log(`request: ${response.request.body} response: ${response.body}`)
  for (const assertion of assertions) {
    if (!matchRequest(assertion.request, requestBody)) {
      continue
    }
    console.log(`Assertion applied: ${JSON.stringify(assertion)}`)
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
