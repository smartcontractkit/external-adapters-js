import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EmptyInputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { vaultTransport } from '../transport/vaults'

export type ResponseSchema = {
  Result: null
  Data: {
    vaults: {
      uuid: string
      valueLocked: number
      fundingTxId: string
      taprootPubKey: string
    }[]
  }
}

export type BaseEndpointTypes = {
  Parameters: EmptyInputParameters
  Response: ResponseSchema
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'vaults',
  transport: vaultTransport,
})
