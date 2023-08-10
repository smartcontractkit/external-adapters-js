import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'
import {
  porBalanceEndpointInputParametersDefinition,
  PoRTotalBalanceEndpoint,
} from '@chainlink/external-adapter-framework/adapter/por'

export const inputParameters = new InputParameters(porBalanceEndpointInputParametersDefinition)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      balances: { address: string; result: string }[]
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRTotalBalanceEndpoint({
  name: 'balance',
  aliases: ['Filecoin.WalletBalance'],
  transport: balanceTransport,
  inputParameters,
})
