import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterResponse,
  AxiosResponse,
  DefaultConfig,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/ea-bootstrap'
import {
  encodeLocationResult,
  LocationResult,
  execute as executeLocation,
  noLocationResult,
} from './location'
import {
  CurrentConditionsResult,
  encodeCurrentConditionsResult,
  execute as executeCurrentConditions,
  noCurrentConditionsResult,
  validateUnitsParameter,
} from './current-conditions'

export interface LocationCurrentConditionsResult extends LocationResult, CurrentConditionsResult {}
export type LocationCurrentConditionsResultEncoded = [boolean, string, string]

export const description = `Returns the current weather conditions in a location by its geoposition

### Data Conversions - Location Current Conditions Endpoint

See [Location Endpoint Data Conversions](#data-conversions---location-endpoint) and [Current Conditions Endpoint Data Conversions](#data-conversions---current-conditions-endpoint)

### Endpoint Measurement Units By System - Location Current Conditions Endpoint

See [Current Conditions Endpoint Measurement Units By System](#measurement-units-by-system---current-conditions-endpoint)

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)`

export const supportedEndpoints = ['location-current-conditions']

export type TInputParameters = {
  lat: number | string
  lon: number | string
  units: string
  encodeResult: boolean
}

export const inputParameters: InputParameters<TInputParameters> = {
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
  units: {
    required: true,
    description: 'The measurement system for the output',
    type: 'string',
    options: ['imperial', 'metric'],
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

// Result when the request was successful but no location was found by a given geolocation
export const noEndpointResult: LocationCurrentConditionsResult = {
  ...noLocationResult,
  ...noCurrentConditionsResult,
}
export const noEndpointResultEncoded: LocationCurrentConditionsResultEncoded = [false, '0x', '0x']

export const execute: ExecuteWithConfig<DefaultConfig> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  // Request Locations API
  const jobRunID = validator.validated.id
  const units = validator.validated.data.units
  const encodeResult = validator.validated.data.encodeResult ?? true

  validateUnitsParameter(jobRunID, units)

  request.data.encodeResult = false // Required for both endpoints

  const locationResponse: AdapterResponse = await executeLocation(request, context, config)

  const locationResult = locationResponse.data.result as unknown as LocationResult
  // No location found for the given coordiantes
  if (locationResult.locationFound === false) {
    const result: LocationCurrentConditionsResult | LocationCurrentConditionsResultEncoded =
      encodeResult ? noEndpointResultEncoded : noEndpointResult
    const endpointResponse: Partial<AxiosResponse> = {
      data: {
        dataLocation: locationResponse.data.data,
        result,
      },
      status: locationResponse.providerStatusCode,
    }
    return Requester.success(jobRunID, endpointResponse, config.verbose)
  }
  // Request CurrentConditions API
  request.data.locationKey = locationResult.locationKey
  request.data.units = units

  const currentConditionsResponse: AdapterResponse = await executeCurrentConditions(
    request,
    context,
    config,
  )
  const currentConditionsResult = currentConditionsResponse.data
    .result as unknown as CurrentConditionsResult
  const endpointResult: LocationCurrentConditionsResult = {
    ...locationResult,
    ...currentConditionsResult,
  }
  let result: LocationCurrentConditionsResult | LocationCurrentConditionsResultEncoded
  if (encodeResult) {
    try {
      result = [
        true,
        encodeLocationResult(endpointResult),
        encodeCurrentConditionsResult(endpointResult),
      ]
    } catch (error) {
      throw new AdapterError({
        jobRunID,
        statusCode: 500,
        message: `Unexpected error encoding result: '${JSON.stringify(
          endpointResult,
        )}'. Reason: ${error}.`,
      })
    }
  } else {
    result = endpointResult
  }
  const endpointResponse: Partial<AxiosResponse> = {
    data: {
      dataLocation: locationResponse.data.data,
      dataCurrentConditions: currentConditionsResponse.data.data,
      result,
    },
    status: locationResponse.providerStatusCode,
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}
