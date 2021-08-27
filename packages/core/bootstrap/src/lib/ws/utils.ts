import { AdapterRequest } from '@chainlink/types'

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
