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

// function exists(name: string) {
//   try {
//     open(name);
//     return true;
//   } catch(e) {
//     return false;
//   }
// }

// function packageExists(name: string) {
//   try {
//     open(name+'/package.json');
//     return true;
//   } catch(e) {
//     return false;
//   }
// }

// const getPathToAdapter = (adapterName: string) => {
//   let pathToAdapter = ''
//   const adapterTypes = ['sources', 'composites', 'targets']
//   for (const type of adapterTypes) {
//     const path = `../../${type}/${adapterName}`
//     if (packageExists(path)) {
//       pathToAdapter = path
//       break
//     }
//   }
//   //return pathToAdapter
//   return '../../sources/coingecko'
// }

// const loadOutputAssertions = (adapterName: string) => {
//   const assertionsPath = __ENV.ASSERTIONS_PATH || `../src/config/assertions/${adapterName}-assertions.json`
//   console.log('assertionsPath', JSON.parse(open(assertionsPath)))
//   if (exists(assertionsPath)) {
//     return JSON.parse(open(assertionsPath))
//   }
//   return []
//   // const assertionsPath = getPathToAdapter(adapterName) + '/output-assertions.json'
//   // if (exists(assertionsPath)) {
//   //   return JSON.parse(open(assertionsPath))
//   // }
//   // return []
// }

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
            request: { url: request.url, data: request.body },
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
  console.log(
    `request: ${response.request.url} ${response.request.body} response: ${response.body}`,
  )
  for (const assertion of assertions) {
    if (!matchRequest(assertion.request, response.request)) {
      continue
    }
    const result = assert(body, assertion.expectedResponse, response.request)
    if (result.output.length) {
      console.log('Assertion failed: ', result.output)
    }
  }
}

// export const validateOutputs = (responses: BatchResponses<BatchRequests>, assertions: Assertion[]) => {
//   const assertionResults: AssertionResult = { success: 0, fail: 0, output: [] }
//   for (const [_, response] of Object.entries(responses)) {
//     if (!response.body) {
//       continue
//     }
//     const body = JSON.parse(response.body.toString())
//     for (const assertion of assertions) {
//       if (!matchRequest(assertion.request, response.request)) {
//         continue
//       }
//       const result = assert(body, assertion.expectedResponse, response.request)
//       assertionResults.success += result.success
//       assertionResults.fail += result.fail
//       assertionResults.output = assertionResults.output.concat(result.output)
//     }
//   }

//   if (assertionResults.output.length) {
//     const assertionsContent = assertionResults.output
//       .map((output) => JSON.stringify(output))
//       .join('\n')
//     console.error('=== assertionsContent ===')
//     console.error(assertionsContent)
//       //fs.writeFileSync(`~/output-${adapterName}-assertions`, assertionsContent, { flag: 'a+' })
//   }

//   const outputContent = Object.values(responses)
//     .filter((response) => response.body)
//     .map(
//       (response) =>
//         `${response.request.url} ${response.request.body}\n${response.body}`,
//     )
//     .join('\n')
//   console.log('=== outputContent ===')
//   console.log(outputContent)
// }
