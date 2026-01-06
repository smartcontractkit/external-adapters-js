import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { transport } from '../transport/da-supply'
import { StringResultResponse } from '../types'

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: StringResultResponse
  Settings: typeof config.settings
}

export const daSupply = new AdapterEndpoint({
  name: 'daSupply',
  aliases: ['daTotalSupply'],
  transport,
})
