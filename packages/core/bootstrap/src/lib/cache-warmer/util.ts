import { omit } from 'lodash'
import { WarmupExecutePayload, WarmupSubscribedPayload } from './actions'
import { get } from './config'
import { BatchableProperty, SubscriptionData } from './reducer'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { hash } from '../util'

const conf = get()
export function getSubscriptionKey(
  request: WarmupSubscribedPayload | WarmupExecutePayload,
): string {
  return hash(
    omit(request, ['id', 'parent', 'children', 'result', 'batchablePropertyPath']),
    conf.hashOpts,
  )
}

type BatchPath = string[]

interface BatchRequestChunk {
  [path: string]: BatchPath
}

export function splitIntoBatches(requestData: SubscriptionData): BatchRequestChunk[] {
  const { batchablePropertyPath, origin } = requestData
  if (!batchablePropertyPath) {
    return []
  }
  const batchesByPath = groupBatchesByPath(batchablePropertyPath, origin)
  return getBatchesArray(batchesByPath)
}

type GroupedBatches = {
  [path: string]: BatchPath[]
}

function groupBatchesByPath(
  batchablePropertyPath: BatchableProperty[],
  origin: AdapterRequest['data'],
): GroupedBatches {
  const batchesByPath: GroupedBatches = {}
  for (const { name, limit } of batchablePropertyPath) {
    if (origin[name]) {
      const batchedValues = origin[name]
      if (limit) {
        batchesByPath[name] = splitValuesIntoBatches(limit, batchedValues)
      } else {
        batchesByPath[name] = [batchedValues]
      }
    }
  }
  return batchesByPath
}

function splitValuesIntoBatches(limit: number, values: string[]): BatchPath[] {
  const batches = []
  let idx = 0
  while (idx < values.length) {
    const batch = values.slice(idx, Math.min(idx + limit, values.length))
    idx += limit
    batches.push(batch)
  }
  return batches
}

function getBatchesArray(batchesByPath: GroupedBatches): BatchRequestChunk[] {
  const batches: BatchRequestChunk[] = []
  populateBatchesArray(batchesByPath, batches, Object.keys(batchesByPath), 0, {})
  return batches
}

function populateBatchesArray(
  batchesByPath: GroupedBatches,
  batches: BatchRequestChunk[],
  batchPaths: BatchPath,
  idx: number,
  currBatch: BatchRequestChunk,
): void {
  if (idx >= batchPaths.length) {
    batches.push(JSON.parse(JSON.stringify(currBatch)))
  } else {
    const currPath = batchPaths[idx]
    const pathBatch = batchesByPath[currPath]
    for (const batchValue of pathBatch) {
      currBatch[currPath] = batchValue
      populateBatchesArray(batchesByPath, batches, batchPaths, idx + 1, currBatch)
      delete currBatch[currPath]
    }
  }
}

export function concatenateBatchResults(
  result: AdapterResponse | null,
  latestResult: AdapterResponse,
): AdapterResponse {
  if (!result) {
    return latestResult
  }
  const mergedResult = JSON.parse(JSON.stringify(result))
  const bases = Object.keys(latestResult.data).filter((base) => base !== 'results')
  for (const base of bases) {
    if (mergedResult.data[base]) {
      mergedResult.data[base] = {
        ...mergedResult.data[base],
        ...latestResult.data[base],
      }
    } else {
      mergedResult.data[base] = latestResult.data[base]
    }
  }
  mergedResult.data.results = mergedResult.data.results.concat(latestResult.data.results)
  return mergedResult
}
