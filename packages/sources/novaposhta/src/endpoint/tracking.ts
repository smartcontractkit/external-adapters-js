import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, Method } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['tracking']

export const endpointResultPaths = {
  tracking: 'data.0.StatusCode',
}

export interface ResponseSchema {
  success: boolean
  data: {
    StatusCode: string
  }[]
}

const customError = (data: ResponseSchema) => data.success === false

export const description =
  'Get shipment status by tracking number (https://developers.novaposhta.ua).'

export type TInputParameters = { number: string }
export const inputParameters: InputParameters<TInputParameters> = {
  number: {
    aliases: ['get', 'track', 'trackNumber', 'tracking', 'trackingNumber'],
    description: 'Tracking number NovaPoshta',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const number = validator.validated.data.number
  const resultPath = validator.validated.data.resultPath

  const data =
    '{' +
    '"apiKey": "",' +
    '"modelName": "TrackingDocument",' +
    '"calledMethod": "getStatusDocuments",' +
    '"methodProperties": {' +
    '"Documents" : [' +
    '{' +
    '"DocumentNumber": "' +
    number +
    '",' +
    '"Phone": ""' +
    '}' +
    ']' +
    '}' +
    '}'

  const options = {
    ...config.api,
    method: 'post' as Method,
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, resultPath)

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
