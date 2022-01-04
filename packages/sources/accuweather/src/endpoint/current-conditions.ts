import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { AxiosResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { utils } from 'ethers'

export interface UnitCondition {
  Value: number
}

export interface UnitsCondition {
  Metric: UnitCondition
  Imperial: UnitCondition
}

export interface CurrentConditions {
  EpochTime: number
  WeatherIcon: number
  PrecipitationType: string | null
  Temperature: UnitsCondition
  RelativeHumidity: number
  Wind: {
    Direction: {
      Degrees: number
    }
    Speed: UnitsCondition
  }
  UVIndex: number
  Pressure: UnitsCondition
  PrecipitationSummary: {
    PastHour: UnitsCondition
    Past12Hours: UnitsCondition
    Past24Hours: UnitsCondition
  }
}

export interface CurrentConditionsResult {
  precipitationPast12Hours: number
  precipitationPast24Hours: number
  precipitationPastHour: number
  precipitationType: number
  pressure: number
  relativeHumidity: number
  temperature: number
  timestamp: number
  uvIndex: number
  weatherIcon: number
  windDirectionDegrees: number
  windSpeed: number
}

export enum Unit {
  IMPERIAL = 'imperial',
  METRIC = 'metric',
}

export const supportedEndpoints = ['current-conditions']

export const inputParameters: InputParameters = {
  locationKey: {
    required: true,
    description:
      'The location unique ID (to be optained via [location](#get-location-endpoint) endpoint)',
    type: 'number',
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
      'When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON',
    type: 'boolean',
    options: [true, false],
    default: true,
  },
}

export const unitsConditionKey: ReadonlyMap<Unit, string> = new Map([
  [Unit.IMPERIAL, 'Imperial'],
  [Unit.METRIC, 'Metric'],
])

export const precipitationTypeNumber: ReadonlyMap<null | string, number> = new Map([
  [null, 0],
  ['Rain', 1],
  ['Snow', 2],
  ['Ice', 3],
  ['Mixed', 4],
])

export const noCurrentConditionsResult: CurrentConditionsResult = {
  precipitationPast12Hours: 0,
  precipitationPast24Hours: 0,
  precipitationPastHour: 0,
  precipitationType: 0,
  pressure: 0,
  relativeHumidity: 0,
  temperature: 0,
  timestamp: 0,
  uvIndex: 0,
  weatherIcon: 0,
  windDirectionDegrees: 0,
  windSpeed: 0,
}

export const validateUnitsParameter = (jobRunID: string, units: string): void => {
  if (!Object.values(Unit).includes(units as Unit)) {
    throw new AdapterError({
      jobRunID,
      message: `Invalid 'units': ${units}. Supported values are: ${Object.values(Unit).join(',')}.`,
      statusCode: 400,
    })
  }
}

const throwError = (message: string): never => {
  throw new Error(message)
}

export const getCurrentConditionsResult = (
  units: Unit,
  currentConditionsList: CurrentConditions[],
): CurrentConditionsResult => {
  if (!currentConditionsList.length)
    throw new Error(`Current conditions not found in: ${JSON.stringify(currentConditionsList)}`)
  if (currentConditionsList.length > 1)
    throw new Error(
      `Multiple current conditions found in: ${JSON.stringify(currentConditionsList)}`,
    )

  const system =
    unitsConditionKey.get(units) ??
    throwError(`Unsupported units: ${units}. Supported units are: ${Unit.IMPERIAL},${Unit.METRIC}.`)

  const currentConditions = currentConditionsList[0]
  const currentConditionsResult: CurrentConditionsResult = {
    precipitationPast12Hours:
      currentConditions.PrecipitationSummary?.Past12Hours?.[system as keyof UnitsCondition]?.Value,
    precipitationPast24Hours:
      currentConditions.PrecipitationSummary?.Past24Hours?.[system as keyof UnitsCondition]?.Value,
    precipitationPastHour:
      currentConditions.PrecipitationSummary?.PastHour?.[system as keyof UnitsCondition]?.Value,
    precipitationType: precipitationTypeNumber.get(currentConditions.PrecipitationType) as number,
    pressure: currentConditions.Pressure?.[system as keyof UnitsCondition]?.Value,
    relativeHumidity: currentConditions.RelativeHumidity,
    temperature: currentConditions.Temperature?.[system as keyof UnitsCondition]?.Value,
    timestamp: currentConditions.EpochTime,
    uvIndex: currentConditions.UVIndex,
    weatherIcon: currentConditions.WeatherIcon,
    windDirectionDegrees: currentConditions.Wind?.Direction?.Degrees,
    windSpeed: currentConditions.Wind?.Speed?.[system as keyof UnitsCondition]?.Value,
  }
  Object.entries(currentConditionsResult).forEach(([key, value]) => {
    value ??
      throwError(
        `Missing '${key}' value in: ${JSON.stringify(
          currentConditionsResult,
        )}. Current conditions are: ${JSON.stringify(currentConditions)}`,
      )
  })
  // Decimal to integer conversions
  currentConditionsResult.precipitationPast12Hours = Math.trunc(
    currentConditionsResult.precipitationPast12Hours * 100,
  )
  currentConditionsResult.precipitationPast24Hours = Math.trunc(
    currentConditionsResult.precipitationPast24Hours * 100,
  )
  currentConditionsResult.precipitationPastHour = Math.trunc(
    currentConditionsResult.precipitationPastHour * 100,
  )
  currentConditionsResult.pressure = Math.trunc(currentConditionsResult.pressure * 100)
  currentConditionsResult.temperature = Math.trunc(currentConditionsResult.temperature * 10)
  currentConditionsResult.windSpeed = Math.trunc(currentConditionsResult.windSpeed * 10)

  // NB: currently all conditions are expected to be integers
  Object.entries(currentConditionsResult).forEach(([key, value]) => {
    if (!Number.isInteger(value))
      throwError(
        `Attribute '${key}' is not an integer: ${JSON.stringify(
          currentConditionsResult,
        )}. Current conditions are: ${JSON.stringify(currentConditions)}`,
      )
  })

  return currentConditionsResult
}

export const encodeCurrentConditionsResult = (result: CurrentConditionsResult): string => {
  const dataTypes = [
    'tuple(uint256,uint24,uint24,uint24,uint24,int16,uint16,uint16,uint8,uint8,uint8,uint8)',
  ]
  const dataValues = [
    [
      result.timestamp, // uint256
      result.precipitationPast12Hours, // uint24
      result.precipitationPast24Hours, // uint24
      result.precipitationPastHour, // uint24
      result.pressure, // uint24
      result.temperature, // int16
      result.windDirectionDegrees, // uint16
      result.windSpeed, // uint16
      result.precipitationType, // uint8
      result.relativeHumidity, // uint8
      result.uvIndex, // uint8
      result.weatherIcon, // uint8
    ],
  ]

  return utils.defaultAbiCoder.encode(dataTypes, dataValues)
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const locationKey = validator.validated.data.locationKey
  const units = validator.validated.data.units
  const encodeResult = validator.validated.data.encodeResult ?? true

  validateUnitsParameter(jobRunID, units)

  const url = `currentconditions/v1/${locationKey}.json`
  const params = {
    details: true,
    apikey: config.apiKey,
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request<Array<CurrentConditions>>(options)

  const currentConditionsList = response.data
  if (!Array.isArray(currentConditionsList)) {
    throw new Error(
      `Unexpected response by location key: ${locationKey}. Expected an array but got: ${JSON.stringify(
        currentConditionsList,
      )}.`,
    )
  }
  let currentConditionsResult: CurrentConditionsResult
  try {
    currentConditionsResult = getCurrentConditionsResult(units, currentConditionsList)
  } catch (error) {
    throw new Error(`Unprocessable response by location key: ${locationKey}. ${error}.`)
  }
  let result: CurrentConditionsResult | string
  if (encodeResult) {
    try {
      result = encodeCurrentConditionsResult(currentConditionsResult)
    } catch (error) {
      throw new Error(
        `Unexpected error encoding result: '${JSON.stringify(
          currentConditionsResult,
        )}' by location key: ${locationKey}. Reason: ${error}.`,
      )
    }
  } else {
    result = currentConditionsResult
  }
  const endpointResponse: Partial<AxiosResponse> = {
    data: {
      data: currentConditionsList,
      result,
    },
  }

  return Requester.success(jobRunID, endpointResponse, config.verbose)
}
