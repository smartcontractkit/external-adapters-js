import { isValidBucket, isValidKeyPrefix } from '../../src/transport/s3utils'

describe('s3utils test', () => {
  describe('isValidBucket', () => {
    it('valid bucket', () => {
      const bucketName = 'valid-s3-bucket.name'
      const result = isValidBucket(bucketName)
      expect(result).toBe(true)
    })
    it('invalid char bucket', () => {
      const bucketName = 'my/bucket_s3'
      const result = isValidBucket(bucketName)
      expect(result).toBe(false)
    })
    it('invalid substring bucket', () => {
      const bucketName = 'invalid..s3-bucket'
      const result = isValidBucket(bucketName)
      expect(result).toBe(false)
    })
  })

  describe('isValidKeyPrefix', () => {
    it('valid keyPrefix', () => {
      const keyPrefix = 'my/Valid_s3-(key)*.name'
      const result = isValidKeyPrefix(keyPrefix)
      expect(result).toBe(true)
    })
    it('invalid char bucket', () => {
      const keyPrefix = 'invalid^key'
      const result = isValidKeyPrefix(keyPrefix)
      expect(result).toBe(false)
    })
    it('invalid substring bucket', () => {
      const keyPrefix = '../my-s3-bucket'
      const result = isValidKeyPrefix(keyPrefix)
      expect(result).toBe(false)
    })
  })
})
