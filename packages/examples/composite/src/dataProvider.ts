import { AdapterContext, Requester } from '@chainlink/ea-bootstrap'
import * as ExampleSourceAdapter from '@chainlink/example-source-adapter'

export const getExampleEAResult = async (
  id: string,
  base: string,
  quote: string,
  context: AdapterContext,
): Promise<number> => {
  // Perform any data provider or external adapter specific logic to transform input if needed
  // ...

  const input = {
    id,
    data: {
      base,
      quote,
    },
  }

  const exampleExecute = ExampleSourceAdapter.makeExecute(ExampleSourceAdapter.makeConfig())
  const response = await exampleExecute(input, context)
  const result = Requester.validateResultNumber(response.result, ['result'])
  return result
}
