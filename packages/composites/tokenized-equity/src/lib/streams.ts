import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { getDeutscheBoersePrice } from '@chainlink/data-engine-adapter'
import { BaseEndpointTypes } from '@chainlink/data-engine-adapter/src/endpoint/deutscheBoerseV11'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import type { GateDecision } from './session/sessionGate'

type DataEngineResponse = BaseEndpointTypes['Response']['Data']

export type StreamName = 'regular' | 'extended' | 'overnight'

export type StreamReports = {
  regular?: DataEngineResponse
  extended?: DataEngineResponse
  overnight?: DataEngineResponse
}

export type StreamSet = StreamReports & {
  errors: Partial<Record<StreamName, string>>
}

export type StreamRejection = {
  stream: StreamName
  reason: string
}

export type EligibilityCheck = (report: DataEngineResponse, stream: StreamName) => GateDecision

export type StreamSelection = {
  stream?: StreamName
  report?: DataEngineResponse
  gate?: Extract<GateDecision, { eligible: true }>
  rejections: StreamRejection[]
}

export type PriceResult = {
  price: string
  spread: bigint
  decimals: number
  marketStatus: TwentyfourFiveMarketStatus
  lastSeenTimestampNs: string
  data: StreamReports
}

/**
 * Fetches every configured stream report. Unlike the old selection helper this
 * keeps partial results so the caller can apply a session gate per candidate.
 */
export const getStreams = async (
  url: string,
  requester: Requester,
  regularStreamId?: string,
  extendedStreamId?: string,
  overnightStreamId?: string,
  overnightStreamMaxAgeInSeconds?: number,
): Promise<StreamSet> => {
  const [regular, extended, overnight] = await Promise.allSettled(
    [regularStreamId, extendedStreamId, overnightStreamId].map((streamId) =>
      streamId
        ? getDeutscheBoersePrice(
            streamId,
            url,
            requester,
            streamId === overnightStreamId
              ? { maxAgeInSeconds: overnightStreamMaxAgeInSeconds }
              : {},
          )
        : Promise.reject(new Error('streamId not provided')),
    ),
  )

  return {
    regular: fulfilledOrUndefined(regular),
    extended: fulfilledOrUndefined(extended),
    overnight: fulfilledOrUndefined(overnight),
    errors: {
      regular: rejectedMessage(regular),
      extended: rejectedMessage(extended),
      overnight: rejectedMessage(overnight),
    },
  }
}

/**
 * Walks the stream priority order and returns the first report that belongs to
 * an active stream and satisfies the optional session gate.
 */
export const selectStream = (
  streams: StreamSet,
  isEligible?: EligibilityCheck,
): StreamSelection => {
  const rejections: StreamRejection[] = []

  for (const stream of STREAM_PRIORITY) {
    const report = streams[stream]
    if (!report) {
      rejections.push({
        stream,
        reason: streams.errors[stream] ?? 'stream is not available',
      })
      continue
    }

    if (!isActiveStatus(stream, report.marketStatus)) {
      rejections.push({
        stream,
        reason: `${statusName(
          report.marketStatus,
        )} is not an active status for the ${stream} stream`,
      })
      continue
    }

    if (isEligible) {
      const decision = isEligible(report, stream)
      if (!decision.eligible) {
        rejections.push({ stream, reason: decision.reason })
        continue
      }
      return { stream, report, gate: decision, rejections }
    }

    return { stream, report, rejections }
  }

  return { rejections }
}

export const toPriceResult = (report: DataEngineResponse, streams: StreamSet): PriceResult => ({
  price: report.mid,
  spread: BigInt(report.ask) - BigInt(report.bid),
  decimals: report.decimals,
  marketStatus: report.marketStatus,
  lastSeenTimestampNs: report.lastSeenTimestampNs,
  data: {
    ...(streams.regular ? { regular: streams.regular } : {}),
    ...(streams.extended ? { extended: streams.extended } : {}),
    ...(streams.overnight ? { overnight: streams.overnight } : {}),
  },
})

/**
 * Convenience wrapper that selects a stream without a session gate. The
 * tokenized-equity transports use getStreams + selectStream directly so they
 * can apply the gate.
 */
export const getPrice = async (
  url: string,
  requester: Requester,
  regularStreamId?: string,
  extendedStreamId?: string,
  overnightStreamId?: string,
  overnightStreamMaxAgeInSeconds?: number,
): Promise<PriceResult> => {
  const streams = await getStreams(
    url,
    requester,
    regularStreamId,
    extendedStreamId,
    overnightStreamId,
    overnightStreamMaxAgeInSeconds,
  )
  const selection = selectStream(streams)

  if (!selection.report) {
    throw new AdapterError({
      statusCode: 503,
      message: `Market is not open: ${formatRejections(selection.rejections)}`,
    })
  }

  return toPriceResult(selection.report, streams)
}

export const formatRejections = (rejections: StreamRejection[]): string =>
  rejections.map((r) => `${r.stream}: ${r.reason}`).join(', ')

const STREAM_PRIORITY: StreamName[] = ['regular', 'extended', 'overnight']

const isActiveStatus = (stream: StreamName, status: TwentyfourFiveMarketStatus): boolean => {
  switch (stream) {
    case 'regular':
      return status === TwentyfourFiveMarketStatus.REGULAR
    case 'extended':
      return (
        status === TwentyfourFiveMarketStatus.PRE_MARKET ||
        status === TwentyfourFiveMarketStatus.POST_MARKET
      )
    case 'overnight':
      return status === TwentyfourFiveMarketStatus.OVERNIGHT
  }
}

const statusName = (status: TwentyfourFiveMarketStatus): string =>
  TwentyfourFiveMarketStatus[status] ?? String(status)

const fulfilledOrUndefined = <T>(result: PromiseSettledResult<T>): T | undefined =>
  result.status === 'fulfilled' ? result.value : undefined

const rejectedMessage = (result: PromiseSettledResult<unknown>): string | undefined =>
  result.status === 'rejected' ? String(result.reason) : undefined
