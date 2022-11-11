export interface Payload {
  name: string
  id: string
  method: string
  data: string
}

/** Example of assertion:
 {
    "request": {"endpoint": "/crypto", "data": { "base": "ETH", "quote": "USD" }},
    "expectedResponse": {
        "result": {"greaterThan": 0, "minPrecision": 10}
    }
} 
Assertions are copied from {pathToAdapterPackage}/output-assertions.json
*/
export type ExpectedResponse = Record<string, Record<string, string | number>>

export type Assertion = {
  request: AssertionRequest
  expectedResponse: ExpectedResponse
}

export type AssertionRequest = {
  endpoint: string
  data: any
}

export type AssertionResult = {
  success: 0
  fail: 0
  output: Array<{
    assertion: string
    key: string
    output: any
    request: { url: string; data: any }
  }>
}
