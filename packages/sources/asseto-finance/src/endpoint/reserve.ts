import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { reserveTransport } from '../transport/reserve'
import { inputParameters } from './common'

export type ReserveResultResponse = {
  Result: number
  Data: {
    fundId: number
    fundName: string
    totalAUM: number
    totalDate: string
    ripcord: string
  }
}

export type ReserveResultErrorResponse = ReserveResultResponse & {
  Data: {
    errorMessage: string
    ripcordDetails?: string
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: ReserveResultResponse | ReserveResultErrorResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'reserve',
  transport: reserveTransport,
  inputParameters,
})
