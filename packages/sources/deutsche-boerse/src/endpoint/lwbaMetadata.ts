import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { lwbaMetadataProtobufWsTransport } from '../transport/lwbaMetadata'
import { inputParameters } from './lwba'

export const endpoint = new AdapterEndpoint({
  name: 'lwba_metadata',
  aliases: [],
  transport: lwbaMetadataProtobufWsTransport,
  inputParameters,
})
