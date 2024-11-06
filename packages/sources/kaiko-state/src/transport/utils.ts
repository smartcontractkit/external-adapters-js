import * as grpc from '@grpc/grpc-js'
import { StreamAggregatedStatePriceResponseV1 } from '@kaiko-data/sdk-node/sdk/stream/aggregated_state_price_v1/response_pb'

export const generateCreds = (apiKey: string): grpc.ChannelCredentials => {
  const metaCallback = (_params: unknown, callback: (_: null, metadata: grpc.Metadata) => void) => {
    const meta = new grpc.Metadata()
    meta.add('Authorization', `Bearer ${apiKey}`)
    callback(null, meta)
  }

  const channelCreds = grpc.credentials.createSsl() as unknown as grpc.CallCredentials
  const callCreds = grpc.credentials.createFromMetadataGenerator(metaCallback)

  return grpc.credentials.combineCallCredentials(
    channelCreds,
    callCreds,
  ) as unknown as grpc.ChannelCredentials
}

export const getProviderIndicatedTimeUnixMs = (response: StreamAggregatedStatePriceResponseV1) => {
  let value: number | undefined
  try {
    value = response.getTsEvent().toObject()['seconds'] * 1000
  } catch (err) {
    value = undefined
  }
  return value
}
