import { AdapterRequest } from '@chainlink/types'

/**
 * Separates a batched request into indivdual requests and calls a callback function with the individual request passed in
 * @param input The original batched request
 * @param dataFields The input request data object's fields
 * @param callback Callback function that is called after batching is complete
 */
export const separateBatches = async (
  input: AdapterRequest,
  dataFields: string[],
  callback: (singleInput: AdapterRequest) => Promise<void>,
): Promise<void> => {
  await separateBatchesHelper(input, input, dataFields, callback)
}

export const separateBatchesHelper = async (
  curr: AdapterRequest,
  input: AdapterRequest,
  dataFields: string[],
  callback: (singleInput: AdapterRequest) => Promise<void>,
): Promise<void> => {
  if (dataFields.length === 0) {
    await callback(curr)
  } else {
    let dataValues = input.data[dataFields[0]]
    if (dataValues) {
      dataValues = Array.isArray(dataValues) ? dataValues : [dataValues]
      for (const val of dataValues) {
        let updatedCurr = JSON.parse(JSON.stringify(curr))
        updatedCurr = {
          ...curr,
          data: {
            ...curr.data,
            [dataFields[0]]: val,
          },
        }
        await separateBatchesHelper(updatedCurr, input, dataFields.slice(1), callback)
      }
    }
  }
}
