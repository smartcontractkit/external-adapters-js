import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import census from 'citysdk'
import { ethers } from 'ethers'

export const supportedEndpoints: string[] = ['census']

type CensusDataset =
  // | 'dec_2020' // not supported yet
  | 'dec_2010'
  | 'acs5_2013'
  | 'acs5_2014'
  | 'acs5_2015'
  | 'acs5_2016'
  | 'acs5_2017'
  | 'acs5_2018'
  | 'acs5_2019'

export const supportedDatasets: CensusDataset[] = [
  // "dec_2020", - not supported yet
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
  dataset: true,
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

  // Result is formatted similarly to:
  // {
  //   NAME: 'Census Tract 201, San Francisco County, California',
  //   B25001_001E: 3481,
  //   state: '06',
  //   county: '075',
  //   tract: '020100'
  // }
  const year = getYearForDataset(request.data.dataset)

  const result = await new Promise<Record<string, string | number>[]>((resolve, reject) =>
    census(
      {
        vintage: year,
        geoHierarchy: {
          [geographyResolved]: {
            lat: latitude,
            lng: longitude,
          },
        },
        sourcePath: getSourcePathForDataset(request.data.dataset),
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

  if (!supportedDatasets.includes(request.data.dataset)) {
    throw new AdapterError({
      jobRunID: request.id,
      statusCode: 400,
      message: 'Dataset is not valid',
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

const getYearForDataset = (dataset: CensusDataset) =>
  dataset === 'dec_2010'
    ? 2010
    : dataset === 'acs5_2013'
    ? 2013
    : dataset === 'acs5_2014'
    ? 2014
    : dataset === 'acs5_2015'
    ? 2015
    : dataset === 'acs5_2016'
    ? 2016
    : dataset === 'acs5_2017'
    ? 2017
    : dataset === 'acs5_2018'
    ? 2018
    : 2019

const getSourcePathForDataset = (dataset: CensusDataset) =>
  dataset === 'dec_2010' ? ['dec', 'sf1'] : ['acs', 'acs5']

const encodeResult = (fipsName: string, variables: (string | number)[]) => {
  const types = ['string', ...Array(variables.length).fill('int256')]
  const values = [fipsName, ...variables]
  return ethers.utils.defaultAbiCoder.encode(types, values)
}
