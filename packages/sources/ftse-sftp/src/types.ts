export interface SftpFileInfo {
  name: string
  type: string
  size: number
  modifyTime: number
  accessTime: number
  rights: {
    user: string
    group: string
    other: string
  }
}

export interface SftpResponse {
  timestamp: number
  [key: string]: any
}

export interface SftpDownloadResponse extends SftpResponse {
  fileName: string
  path: string
  content: string
  contentType: 'base64'
}
