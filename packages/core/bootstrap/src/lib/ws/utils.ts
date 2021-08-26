import { AdapterRequest } from '@chainlink/types'

export const separateBatches = async (
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
        await separateBatches(updatedCurr, input, dataFields.slice(1), callback)
      }
    }
  }
}
