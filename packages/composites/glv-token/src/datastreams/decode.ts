import { AbiCoder, getBytes, isHexString } from 'ethers'
import {
  DecodedV10Report,
  DecodedV2Report,
  DecodedV3Report,
  DecodedV4Report,
  DecodedV5Report,
  DecodedV6Report,
  DecodedV7Report,
  DecodedV8Report,
  DecodedV9Report,
  MarketStatus,
} from './types'
import { ReportDecodingError } from './types/errors'

const globalAbiCoder = new AbiCoder()
const outerReportAbiCoder = new AbiCoder()

const reportSchemaV2 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
]

const reportSchemaV3 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'bid' },
  { type: 'int192', name: 'ask' },
]

const reportSchemaV4 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'uint8', name: 'marketStatus' },
]

const reportSchemaV5 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'rate' },
  { type: 'uint32', name: 'timestamp' },
  { type: 'uint32', name: 'duration' },
]

const reportSchemaV6 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'price' },
  { type: 'int192', name: 'price2' },
  { type: 'int192', name: 'price3' },
  { type: 'int192', name: 'price4' },
  { type: 'int192', name: 'price5' },
]

const reportSchemaV7 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'exchangeRate' },
]

const reportSchemaV8 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'midPrice' },
  { type: 'uint32', name: 'marketStatus' },
]

const reportSchemaV9 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'int192', name: 'navPerShare' },
  { type: 'uint64', name: 'navDate' },
  { type: 'int192', name: 'aum' },
  { type: 'uint32', name: 'ripcord' },
]

const reportSchemaV10 = [
  { type: 'bytes32', name: 'feedId' },
  { type: 'uint32', name: 'validFromTimestamp' },
  { type: 'uint32', name: 'observationsTimestamp' },
  { type: 'uint192', name: 'nativeFee' },
  { type: 'uint192', name: 'linkFee' },
  { type: 'uint32', name: 'expiresAt' },
  { type: 'uint64', name: 'lastUpdateTimestamp' },
  { type: 'int192', name: 'price' },
  { type: 'uint32', name: 'marketStatus' },
  { type: 'int192', name: 'currentMultiplier' },
  { type: 'int192', name: 'newMultiplier' },
  { type: 'uint32', name: 'activationDateTime' },
  { type: 'int192', name: 'tokenizedPrice' },
]

/**
 * Decode a report from its hex string representation
 * @param reportHex The hex string representation of the report
 * @param feedId The feed ID (stream ID) which contains the version information
 * @returns The decoded report data
 * @throws ReportDecodingError if decoding fails
 */
export function decodeReport(
  reportHex: string,
  feedId: string,
):
  | DecodedV2Report
  | DecodedV3Report
  | DecodedV4Report
  | DecodedV5Report
  | DecodedV6Report
  | DecodedV7Report
  | DecodedV8Report
  | DecodedV9Report
  | DecodedV10Report {
  try {
    // Ensure the report starts with 0x
    if (!isHexString(reportHex)) {
      throw new ReportDecodingError('Report hex string must start with 0x')
    }

    // Extract version from feed ID (first 4 bytes after 0x)
    const version = feedId.slice(2, 6)

    // First decode the full report structure to get the report blob
    const fullReportAbi = [
      { type: 'bytes32[3]', name: 'reportContext' },
      { type: 'bytes', name: 'reportBlob' },
      { type: 'bytes32[]', name: 'rawRs' },
      { type: 'bytes32[]', name: 'rawSs' },
      { type: 'bytes32', name: 'rawVs' },
    ]

    const decodedFullReport = outerReportAbiCoder.decode(
      fullReportAbi.map((item) => item.type),
      reportHex,
    )

    const reportBlob = decodedFullReport[1]

    switch (version) {
      case '0002':
        return decodeV2Report(reportBlob)
      case '0003':
        return decodeV3Report(reportBlob)
      case '0004':
        return decodeV4Report(reportBlob)
      case '0005':
        return decodeV5Report(reportBlob)
      case '0006':
        return decodeV6Report(reportBlob)
      case '0007':
        return decodeV7Report(reportBlob)
      case '0008':
        return decodeV8Report(reportBlob)
      case '0009':
        return decodeV9Report(reportBlob)
      case '000a':
        return decodeV10Report(reportBlob)
      default:
        throw new ReportDecodingError(`Unknown report version: 0x${version}`)
    }
  } catch (error) {
    if (error instanceof ReportDecodingError) {
      throw error
    }
    throw new ReportDecodingError(
      `Failed to decode report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV2Report(reportBlob: string): DecodedV2Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV2.map((item) => item.type),
      getBytes(reportBlob),
    )

    return {
      version: 'V2',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      price: decoded[6],
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V2 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV3Report(reportBlob: string): DecodedV3Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV3.map((item) => item.type),
      getBytes(reportBlob),
    )

    return {
      version: 'V3',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      price: decoded[6],
      bid: decoded[7],
      ask: decoded[8],
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V3 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV4Report(reportBlob: string): DecodedV4Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV4.map((item) => item.type),
      getBytes(reportBlob),
    )

    const marketStatus = Number(decoded[7])
    if (
      marketStatus !== MarketStatus.UNKNOWN &&
      marketStatus !== MarketStatus.INACTIVE &&
      marketStatus !== MarketStatus.ACTIVE
    ) {
      throw new ReportDecodingError(`Invalid market status: ${marketStatus}`)
    }

    return {
      version: 'V4',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      price: decoded[6],
      marketStatus,
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V4 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV5Report(reportBlob: string): DecodedV5Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV5.map((item) => item.type),
      getBytes(reportBlob),
    )

    return {
      version: 'V5',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      rate: decoded[6],
      timestamp: Number(decoded[7]),
      duration: Number(decoded[8]),
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V5 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV6Report(reportBlob: string): DecodedV6Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV6.map((item) => item.type),
      getBytes(reportBlob),
    )

    return {
      version: 'V6',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      price: decoded[6],
      price2: decoded[7],
      price3: decoded[8],
      price4: decoded[9],
      price5: decoded[10],
    } as unknown as DecodedV6Report // price fields are bigint
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V6 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV7Report(reportBlob: string): DecodedV7Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV7.map((item) => item.type),
      getBytes(reportBlob),
    )

    return {
      version: 'V7',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      exchangeRate: decoded[6],
    } as unknown as DecodedV7Report
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V7 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV8Report(reportBlob: string): DecodedV8Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV8.map((item) => item.type),
      getBytes(reportBlob),
    )

    const marketStatus = Number(decoded[8])
    if (
      marketStatus !== MarketStatus.UNKNOWN &&
      marketStatus !== MarketStatus.INACTIVE &&
      marketStatus !== MarketStatus.ACTIVE
    ) {
      throw new ReportDecodingError(`Invalid market status: ${marketStatus}`)
    }

    return {
      version: 'V8',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      lastUpdateTimestamp: Number(decoded[6]),
      midPrice: decoded[7],
      marketStatus,
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V8 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV9Report(reportBlob: string): DecodedV9Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV9.map((item) => item.type),
      getBytes(reportBlob),
    )

    const ripcord = Number(decoded[9])
    if (ripcord !== 0 && ripcord !== 1) {
      throw new ReportDecodingError(
        `Invalid ripcord value: ${ripcord}. Must be 0 (normal) or 1 (paused)`,
      )
    }

    return {
      version: 'V9',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      navPerShare: decoded[6],
      navDate: Number(decoded[7]),
      aum: decoded[8],
      ripcord,
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V9 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function decodeV10Report(reportBlob: string): DecodedV10Report {
  try {
    const decoded = globalAbiCoder.decode(
      reportSchemaV10.map((item) => item.type),
      getBytes(reportBlob),
    )

    const marketStatus = Number(decoded[8])
    if (
      marketStatus !== MarketStatus.UNKNOWN &&
      marketStatus !== MarketStatus.INACTIVE &&
      marketStatus !== MarketStatus.ACTIVE
    ) {
      throw new ReportDecodingError(`Invalid market status: ${marketStatus}`)
    }

    return {
      version: 'V10',
      nativeFee: decoded[3],
      linkFee: decoded[4],
      expiresAt: Number(decoded[5]),
      lastUpdateTimestamp: Number(decoded[6]),
      price: decoded[7],
      marketStatus,
      currentMultiplier: decoded[9],
      newMultiplier: decoded[10],
      activationDateTime: Number(decoded[11]),
      tokenizedPrice: decoded[12],
    }
  } catch (error) {
    throw new ReportDecodingError(
      `Failed to decode V10 report: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
