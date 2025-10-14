import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { getFileContentsFromFileRegex } from '../../src/transport/utils'

const mockSftpClient = makeStub('mockSftpClient', {
  connect: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  end: jest.fn(),
})

jest.mock(
  'ssh2-sftp-client',
  () =>
    function () {
      return mockSftpClient
    },
)

LoggerFactoryProvider.set()

describe('Transport utils', () => {
  const host = 'sftp.test.com'
  const port = 22
  const username = 'testuser'
  const password = 'testpassword'
  const connectOptions = {
    host,
    port,
    username,
    password,
  }
  const directory = '/some/directory'
  const filenameRegex = /^test_file_\d{3}\.csv/
  const expectedFilename = 'test_file_123.csv'
  const expectedFilename2 = 'test_file_456.csv'
  const expectedFullPath = '/some/directory/test_file_123.csv'
  const differentFilename1 = 'test_file_9999.csv'
  const differentFilename2 = 'differentfile_9999.csv'
  const differentFilename3 = 'test_file_123.txt'
  const expectedContent = 'some,file,content'

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    mockSftpClient.get.mockResolvedValue(Buffer.from(expectedContent))
  })

  describe('getFileContentsFromFileRegex', () => {
    it('should return filename and content', async () => {
      mockSftpClient.list.mockResolvedValue([{ name: expectedFilename }])

      const { filename, fileContent } = await getFileContentsFromFileRegex({
        connectOptions,
        directory,
        filenameRegex,
      })

      expect(filename).toBe(expectedFilename)
      expect(fileContent.toString()).toBe(expectedContent)

      expect(mockSftpClient.connect).toHaveBeenCalledWith(connectOptions)
      expect(mockSftpClient.connect).toHaveBeenCalledTimes(1)
      expect(mockSftpClient.list).toHaveBeenCalledWith(directory)
      expect(mockSftpClient.list).toHaveBeenCalledTimes(1)
      expect(mockSftpClient.get).toHaveBeenCalledWith(expectedFullPath)
      expect(mockSftpClient.get).toHaveBeenCalledTimes(1)
      expect(mockSftpClient.end).toHaveBeenCalledTimes(1)
    })

    it('should load correct file among multiple', async () => {
      mockSftpClient.list.mockResolvedValue([
        { name: differentFilename1 },
        { name: differentFilename2 },
        { name: expectedFilename },
        { name: differentFilename3 },
      ])

      const { filename, fileContent } = await getFileContentsFromFileRegex({
        connectOptions,
        directory,
        filenameRegex,
      })

      expect(filename).toBe(expectedFilename)
      expect(fileContent.toString()).toBe(expectedContent)
      expect(mockSftpClient.get).toHaveBeenCalledWith(expectedFullPath)
      expect(mockSftpClient.get).toHaveBeenCalledTimes(1)
    })

    it('should throw if file not found', async () => {
      mockSftpClient.list.mockResolvedValue([
        { name: differentFilename1 },
        { name: differentFilename2 },
        { name: differentFilename3 },
      ])

      await expect(() =>
        getFileContentsFromFileRegex({
          connectOptions,
          directory,
          filenameRegex,
        }),
      ).rejects.toThrow(
        `No files matching pattern ${filenameRegex} found in directory '${directory}'`,
      )

      expect(mockSftpClient.end).toHaveBeenCalledTimes(1)
    })

    it('should throw if multiple files match', async () => {
      mockSftpClient.list.mockResolvedValue([
        { name: differentFilename1 },
        { name: expectedFilename },
        { name: expectedFilename2 },
      ])

      await expect(() =>
        getFileContentsFromFileRegex({
          connectOptions,
          directory,
          filenameRegex,
        }),
      ).rejects.toThrow(
        `Multiple files matching pattern ${filenameRegex} found in directory '${directory}': test_file_123.csv, test_file_456.csv`,
      )

      expect(mockSftpClient.end).toHaveBeenCalledTimes(1)
    })

    it('should end the connection if the client throws an error', async () => {
      const errorMessage = 'error listing files'
      mockSftpClient.list.mockRejectedValue(new Error(errorMessage))

      await expect(() =>
        getFileContentsFromFileRegex({
          connectOptions,
          directory,
          filenameRegex,
        }),
      ).rejects.toThrow(errorMessage)

      expect(mockSftpClient.end).toHaveBeenCalledTimes(1)
    })
  })
})
