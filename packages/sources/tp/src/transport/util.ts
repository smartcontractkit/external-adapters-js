export const streamNameToAdapterNameOverride = (streamName: string) => {
  if (streamName == 'IC') {
    return 'ICAP'
  } else {
    return streamName
  }
}
