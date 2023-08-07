import { omit } from 'lodash'
import { WarmupExecutePayload, WarmupSubscribedPayload } from './actions'
import { get } from './config'
import { SubscriptionData } from './reducer'
import type {
  AdapterData,
  AdapterRequest,
  AdapterRequestData,
  AdapterResponse,
  BatchableProperty,
} from '../../../types'
import { hash } from '../../middleware/cache-key/util'

const conf = get()

/**
 * Returns hash of the input request payload excluding some volatile paths
 *
 * @param request payload
 */
export function getSubscriptionKey<D extends AdapterData>(
  request: WarmupSubscribedPayload<D> | WarmupExecutePayload<D>,
): string {
  return hash(
    omit(request, [
      'id',
      'parent',
      'children',
      'result',
      'batchablePropertyPath',
    ]) as AdapterRequest<AdapterData>,
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
  origin: AdapterRequestData,
): GroupedBatches {
  const batchesByPath: GroupedBatches = {}
  for (const { name, limit } of batchablePropertyPath) {
    const batchedValues = origin[name] as string[]
    if (batchedValues) {
      batchesByPath[name] = limit ? splitValuesIntoBatches(limit, batchedValues) : [batchedValues]
    }
  }
  return batchesByPath
}

function splitValuesIntoBatches(limit: number, values: string[]): BatchPath[] {
  const batches: BatchPath[] = []
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
  if (!result) return latestResult

  const mergedResult = JSON.parse(JSON.stringify(result)) as AdapterResponse
  const bases = Object.keys(latestResult.data).filter((base) => base !== 'results')

  for (const base of bases) {
    const previous = mergedResult.data[base]
    const latest = latestResult.data[base]
    if (previous && typeof previous === 'object' && typeof latest === 'object') {
      const merged = {
        ...previous,
        ...latest,
      } as Omit<AdapterResponse['data'], 'results'>['name']
      mergedResult.data[base] = merged
    } else {
      mergedResult.data[base] = latestResult.data[base]
    }
  }

  if (latestResult.data.results)
    mergedResult.data.results = mergedResult.data.results?.concat(latestResult.data.results)

  return mergedResult
}
