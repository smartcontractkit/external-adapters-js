import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import path from 'path'
import SftpClient, { ConnectOptions, FileInfo } from 'ssh2-sftp-client'

const logger = makeLogger('FTSE SFTP Utils')

// Downloads the single file matching the provided regex from the specified
// directory over SFTP.
export const getFileContentsFromFileRegex = async ({
  connectOptions,
  directory,
  filenameRegex,
}: {
  connectOptions: ConnectOptions
  directory: string
  filenameRegex: RegExp
}): Promise<{
  filename: string
  fileContent: string | NodeJS.WritableStream | Buffer
}> => {
  const client = new SftpClient()
  try {
    await client.connect(connectOptions)
    logger.debug('Successfully connected to SFTP server')

    const filename = await getFilenameFromRegex({
      client,
      directory,
      filenameRegex,
    })
    const filePath = path.join(directory, filename)

    return {
      filename,
      fileContent: await client.get(filePath),
    }
  } finally {
    client.end()
    logger.debug('SFTP connection closed')
  }
}

export const getFilenameFromRegex = async ({
  client,
  directory,
  filenameRegex,
}: {
  client: SftpClient
  directory: string
  filenameRegex: RegExp
}): Promise<string> => {
  const fileList = await client.list(directory)
  // Filter files based on the regex pattern
  const matchingFiles = fileList
    .map((file: FileInfo) => file.name)
    .filter((fileName: string) => filenameRegex.test(fileName))

  if (matchingFiles.length === 0) {
    throw new AdapterInputError({
      statusCode: 500,
      message: `No files matching pattern ${filenameRegex} found in directory '${directory}'`,
    })
  } else if (matchingFiles.length > 1) {
    throw new AdapterInputError({
      statusCode: 500,
      message: `Multiple files matching pattern ${filenameRegex} found in directory '${directory}': ${matchingFiles.join(
        ', ',
      )}`,
    })
  }

  return matchingFiles[0]
}
