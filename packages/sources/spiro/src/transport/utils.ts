// FRAMEWORK-EXCEPTION-BEGIN: SPIRO-5
export interface RipcordSchema {
  ripcord: boolean
  ripcordDetails: string[]
}

export const checkRipcord = (data: RipcordSchema, noErrorOnRipcord: boolean) => {
  const ripcord = data.ripcord === true || String(data.ripcord).toLowerCase() === 'true'
  const ripcordAsInt = ripcord ? 1 : 0

  if (ripcord && !noErrorOnRipcord) {
    const ripcordDetails = (data.ripcordDetails ?? []).join(', ')
    return {
      ripcord,
      ripcordAsInt,
      message: `Ripcord indicator true. Details: ${ripcordDetails}`,
    }
  }

  return { ripcord, ripcordAsInt }
}
// FRAMEWORK-EXCEPTION-END: SPIRO-5
