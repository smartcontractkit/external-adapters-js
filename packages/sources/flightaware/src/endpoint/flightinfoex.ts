import { AxiosRequestConfig, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['estimatedarrivaltime', 'actualarrivaltime']

export const endpointResultPaths = {
  estimatedarrivaltime: 'FlightInfoExResult.flights.0.estimatedarrivaltime',
  actualarrivaltime: 'FlightInfoExResult.flights.0.actualarrivaltime',
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

export const description = `Supports the following endpoint params to return a field in the response data:
- \`estimatedarrivaltime\`: Returns the estimatedarrivaltime value from the [FlightInfoEx](https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx) endpoint
- \`actualarrivaltime\`: Returns the actualarrivaltime value from the [FlightInfoEx](https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx) endpoint`

export type TInputParameters = { departure: number; flight: string }
export const inputParameters: InputParameters<TInputParameters> = {
  departure: {
    required: true,
    description: 'The departure time of the flight as a UNIX timestamp in seconds',
    type: 'number',
  },
  flight: {
    required: true,
    description: 'The flight ID',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

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
    username: config.api?.auth?.username || '',
    password: config.apiKey || '',
  }

  const options: AxiosRequestConfig = { ...config.api, auth, params, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
