import {
  Requester,
  Validator,
  AdapterError,
  AxiosRequestConfig,
  AxiosRequestHeaders,
} from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['graphql']

export type TInputParameters = {
  graphqlEndpoint: string
  headers?: AxiosRequestHeaders
  query: string
  variables?: Record<string, string | number | boolean>
}
export const inputParameters: InputParameters<TInputParameters> = {
  graphqlEndpoint: {
    required: true,
    type: 'string',
    description: 'The GraphQL endpoint to make a request to',
  },
  headers: {
    required: false,
  },
  query: {
    required: true,
    description: 'The GraphQL query as a string',
    type: 'string',
  },
  variables: {
    required: false,
    description: 'An object of variables to be passed into the query',
    type: 'object',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const { graphqlEndpoint, query, variables, headers } = request.data as TInputParameters
  const reqConfig: AxiosRequestConfig = {
    ...config.api,
    url: graphqlEndpoint,
    data: {
      query,
      variables,
    },
    headers,
  }
  try {
    const response = await Requester.request<Record<string, unknown>>(reqConfig)

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
