import { Requester, Validator } from '@chainlink/ea-bootstrap'
import {
  AdapterResponse,
  AxiosResponse,
  Config,
  ExecuteWithConfig,
  InputParameters,
} from '@chainlink/types'
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

export const supportedEndpoints = ['location-current-conditions']

export const inputParameters: InputParameters = {
  lat: ['lat', 'latitude'],
  lon: ['lon', 'long', 'longitude'],
  units: true,
  encodeResult: false,
}

// Result when the request was successful but no location was found by a given geolocation
export const noEndpointResult: LocationCurrentConditionsResult = {
  ...noLocationResult,
  ...noCurrentConditionsResult,
}
export const noEndpointResultEncoded: LocationCurrentConditionsResultEncoded = [false, '0x', '0x']

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  // Request Locations API
  const jobRunID = validator.validated.id
  const units = validator.validated.data.units
  const encodeResult = validator.validated.data.encodeResult ?? true

  validateUnitsParameter(jobRunID, units)

  request.data.encodeResult = false // Required for both endpoints

  const locationResponse: AdapterResponse = await executeLocation(request, context, config)

  const locationResult: LocationResult = locationResponse.data.result
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
  const currentConditionsResult: CurrentConditionsResult = currentConditionsResponse.data.result
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
      throw new Error(
        `Unexpected error encoding result: '${JSON.stringify(endpointResult)}'. Reason: ${error}.`,
      )
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
