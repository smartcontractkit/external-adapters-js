import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['estimatedarrivaltime']

export const endpointResultPaths = {
  estimatedarrivaltime: 'FlightInfoExResult.flights.0.estimatedarrivaltime',
}

interface Flights {
  faFlightID: string
  ident: string
  aircrafttype: string
  filed_ete: string
  filed_time: number
  filed_departuretime: number
  filed_airspeed_kts: number
  filed_airspeed_mach: string
  filed_altitude: number
  route: string
  actualdeparturetime: number
  estimatedarrivaltime: number
  actualarrivaltime: number
  diverted: string
  origin: string
  destination: string
  originName: string
  originCity: string
  destinationName: string
  destinationCity: string
}

export interface ResponseSchema {
  FlightInfoExResult: {
    next_offset: number
    flights: Flights[]
  }
}

export const inputParameters: InputParameters = {
  departure: true,
  flight: true,
  resultPath: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath
  const departure = validator.validated.data.departure
  const flight = validator.validated.data.flight
  const url = 'FlightInfoEx'
  const ident = `${flight}@${departure}`

  const params = {
    ident,
  }

  const auth = {
    username: config.api.username,
    password: config.apiKey,
  }

  const options = { ...config.api, auth, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
