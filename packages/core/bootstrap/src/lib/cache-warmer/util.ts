import { omit } from 'lodash'
import { WarmupExecutePayload, WarmupSubscribedPayload } from './actions'
import { get } from './config'
import { BatchableProperty, SubscriptionData } from './reducer'
import { AdapterRequest } from "@chainlink/types"
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

export function splitIntoBatches(requestData: SubscriptionData): {
  [path: string]: string[]
}[] {
  const { batchablePropertyPath, origin } = requestData
  if (!batchablePropertyPath) {
    return []
  }
  const batchesByPath = groupBatchesByPath(batchablePropertyPath, origin)
  return getBatchesArray(batchesByPath)
}

function groupBatchesByPath(batchablePropertyPath: BatchableProperty[], origin: AdapterRequest["data"]): { [path: string]: string[][] } {
  const batchesByPath: { [path: string]: string[][] } = {}
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

function splitValuesIntoBatches(limit: number, values: string[]): string[][] {
  const batches = []
  let idx = 0
  while(idx < values.length) {
    const batch = values.slice(idx, Math.min(idx + limit, values.length))
    idx += limit 
    batches.push(batch)
  }
  return batches 
}

function getBatchesArray(batchesByPath: { [path: string]: string[][] }): {
  [path: string]: string[]
}[] {
  const batches: {
    [path: string]: string[]
  }[] = []
  populateBatchesArray(batchesByPath, batches, Object.keys(batchesByPath), 0, {})
  return batches
}

function populateBatchesArray(batchesByPath: { [path: string]: string[][] }, batches: { [path: string]: string[] }[], batchPaths: string[], idx: number, currBatch: { [path: string]: string[] }): void {
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