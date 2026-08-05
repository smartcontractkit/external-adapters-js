import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'

export const inputParameters = new InputParameters({})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: string
    Data: {
      price: number
      rawValue: string
      scale: number
      lastUpdatedAt: number
      signature: string
    }
  }
}
