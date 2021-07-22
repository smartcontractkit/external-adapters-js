import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.jobRunID
  const { graphqlEndpoint, query, variables, headers } = request.data
  const reqConfig = {
    ...config.api,
    url: graphqlEndpoint,
    data: {
      query,
      variables,
    },
    headers,
  }
  try {
    const response = await Requester.request(reqConfig)

    // Prevent circular reference
    const responseData = JSON.parse(JSON.stringify(response.data))
    response.data.result = responseData
    return Requester.success(jobRunID, response, config.verbose)
  } catch (e) {
    throw new AdapterError({
      jobRunID,
      message: `GraphQL request to ${graphqlEndpoint} failed with error ${e}`,
    })
  }
}
