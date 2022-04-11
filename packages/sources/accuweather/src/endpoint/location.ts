import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AxiosResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { utils } from 'ethers'

export interface Location {
  Key: string
  EnglishName: string
  Country: {
    ID: string
  }
}

export interface LocationResult {
  locationFound: boolean
  locationKey: number
  name: string
  countryCode: string
}
export type LocationResultEncoded = [boolean, string]

export const supportedEndpoints = ['location']

export const description = `Returns location information by geoposition

### Data Conversions - Location Endpoint

**countryCode**

ISO 3166 alpha-2 codes encoded as \`bytes2\`. See [list of ISO-3166 country codes](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes)

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)`

export const inputParameters: InputParameters = {
  lat: {
    aliases: ['latitude'],
    description: 'The latitude (WGS84 standard). Must be `-90` to `90`.',
    required: true,
  },
  lon: {
    aliases: ['long', 'longitude'],
    description: 'The longitude (WGS84 standard). Must be `-180` to `180`.',
    required: true,
  },
  encodeResult: {
    required: false,
    description:
      'When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON.',
    type: 'boolean',
    options: [true, false],
    default: true,
  },
}
const url = `locations/v1/geoposition/search.json`

// Result when the request was successful but no location was found by a given geolocation
export const noLocationResult: LocationResult = {
  locationFound: false,
  locationKey: 0, // NB: Key 0 does not belong to any location in the Accuweather locations API.
  name: '',
  countryCode: '0x',
}

const throwError = (message: string): never => {
  throw new Error(message)
}

export const getLocationResult = (locations: Location[]): LocationResult => {
  if (!locations.length) return noLocationResult
  if (locations.length > 1)
    throw new Error(`Multiple locations found in: ${JSON.stringify(locations)}`)

  const locationResult = {
    locationFound: true,
    locationKey: Number(locations[0].Key),
    name: locations[0].EnglishName,
    countryCode: locations[0].Country?.ID,
  }

  if (Number.isNaN(locationResult.locationKey))
    throwError(`Invalid location Key in: ${JSON.stringify(locations[0])}`)

  Object.entries(locationResult).forEach(([key, value]) => {
    value ??
      throwError(
        `Missing value in attribute '${key}' of ${JSON.stringify(
          locationResult,
        )}. Location is: ${JSON.stringify(locations[0])}`,
      )
  })
  // Conversions
  // NB: do not convert 'name' to bytes32 as there are longer values, i.e. 'Bonadelle Ranchos-Madera Ranchos'
  locationResult.countryCode = `0x${Buffer.from(locationResult.countryCode).toString('hex')}`

  return locationResult
}

export const encodeLocationResult = (result: LocationResult): string => {
  const dataTypes = ['tuple(uint256,string,bytes2)']
  const dataValues = [[result.locationKey, result.name, utils.hexZeroPad(result.countryCode, 2)]]

  return utils.defaultAbiCoder.encode(dataTypes, dataValues)
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const latitude = validator.validated.data.lat
  const longitude = validator.validated.data.lon
  const encodeResult = validator.validated.data.encodeResult

  const coord = `${latitude},${longitude}`
  const params = {
    q: coord,
    apikey: config.apiKey,
  }
  const options = { ...config.api, params, url }

  const response = await Requester.request<Array<Location>>(options)

  const locations = response.data
  if (!Array.isArray(locations)) {
    throw new Error(
      `Unexpected response by geoposition: '${coord}'. Expected an array but got: ${JSON.stringify(
        locations,
      )}.`,
    )
  }
  let locationResult: LocationResult
  try {
    locationResult = getLocationResult(locations)
  } catch (error) {
    throw new Error(`Unprocessable response by geoposition: '${coord}'. ${error}.`)
  }
  let result: LocationResult | LocationResultEncoded
  if (encodeResult) {
    try {
      result = locationResult.locationFound
        ? [true, encodeLocationResult(locationResult)]
        : [false, '0x']
    } catch (error) {
      throw new Error(
        `Unexpected error encoding result: '${JSON.stringify(
          locationResult,
        )}' by geoposition: '${coord}'. Reason: ${error}.`,
      )
    }
  } else {
    result = locationResult
  }
  const endpointResponse: Partial<AxiosResponse> = {
    data: {
      data: response.data,
      result,
    },
    status: response.status,
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}
