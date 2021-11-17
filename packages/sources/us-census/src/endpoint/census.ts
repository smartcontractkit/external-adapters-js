import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import census from 'citysdk'
import { ethers } from 'ethers'

type Endpoint =
  | 'dec_2010'
  | 'acs5_2013'
  | 'acs5_2014'
  | 'acs5_2015'
  | 'acs5_2016'
  | 'acs5_2017'
  | 'acs5_2018'
  | 'acs5_2019'

export const supportedEndpoints: Endpoint[] = [
  'dec_2010',
  'acs5_2013',
  'acs5_2014',
  'acs5_2015',
  'acs5_2016',
  'acs5_2017',
  'acs5_2018',
  'acs5_2019',
]

export const inputParameters: InputParameters = {
  variables: true,
  longitude: true,
  latitude: true,
  geography: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  validateRequest(request)

  const { longitude, latitude } = validator.validated.data
  const variables: string[] = validator.validated.data.variables
  const geography: string = validator.validated.data.geography

  const jobRunID = validator.validated.id

  const geographyResolved = (geography || 'state').replace('_', ' ') // replace underscores

  try {
    // Result is formatted similarly to:
    // {
    //   NAME: 'Census Tract 201, San Francisco County, California',
    //   B25001_001E: 3481,
    //   state: '06',
    //   county: '075',
    //   tract: '020100'
    // }
    const result = await new Promise<Record<string, string | number>[]>((resolve, reject) =>
      census(
        {
          vintage: getYearForEndpoint(request.data.endpoint),
          geoHierarchy: {
            [geographyResolved]: {
              lat: latitude,
              lng: longitude,
            },
          },
          sourcePath: getSourcePathForEndpoint(request.data.endpoint),
          values: ['NAME', ...variables],
          statsKey: config.apiKey === 'test_api_key' ? undefined : config.apiKey,
        },
        (err: Error, res: Record<string, string | number>[]) => {
          if (err) {
            return reject(err)
          }

          return resolve(res)
        },
      ),
    )

    const firstResult = result?.[0]

    const fipsName = firstResult?.NAME.toString()
    const censusVariables = variables.map((variable) => result?.[0]?.[variable])

    const encodedResult = encodeResult(fipsName, censusVariables)

    const respData = {
      data: {
        ...firstResult,
        result: encodedResult,
      },
      result: encodedResult,
    }

    return Requester.success(jobRunID, respData, config.verbose)
  } catch (e) {
    throw Requester.errored(jobRunID, e, 400)
  }
}

const validateRequest = (request: AdapterRequest) => {
  const { variables, longitude, latitude } = request.data

  if (variables.length === 0) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Variables cannot be empty',
    })
  }

  if (!supportedEndpoints.includes(request.data.endpoint)) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Endpoint is not valid',
    })
  }

  if (!longitude || !latitude) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Longitude and Latitude must be valid non-zero numbers',
    })
  }
}

const getYearForEndpoint = (endpoint: Endpoint) =>
  endpoint === 'dec_2010'
    ? 2010
    : endpoint === 'acs5_2013'
    ? 2013
    : endpoint === 'acs5_2014'
    ? 2014
    : endpoint === 'acs5_2015'
    ? 2015
    : endpoint === 'acs5_2016'
    ? 2016
    : endpoint === 'acs5_2017'
    ? 2017
    : endpoint === 'acs5_2018'
    ? 2018
    : endpoint === 'acs5_2019'
    ? 2019
    : -1

const getSourcePathForEndpoint = (endpoint: Endpoint) =>
  endpoint === 'dec_2010' ? ['dec', 'sf1'] : ['acs', 'acs5']

const encodeResult = (fipsName: string, variables: (string | number)[]) => {
  console.log({ variables })
  const types = ['string', ...Array(variables.length).fill('int256')]
  const values = [fipsName, ...variables]
  return ethers.utils.defaultAbiCoder.encode(types, values)
}
