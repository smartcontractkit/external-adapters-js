import { generateFileJSON, ImageNameConfig } from './docker-build'
describe('docker compose file generation', () => {
  const nullImageNameConfig: ImageNameConfig = {
    prefix: '',
    tag: 'latest',
  }
  describe('image name generation', () => {
    it('should generate base dockerfile images', () => {
      const output = generateFileJSON(nullImageNameConfig)
      expect(output).toMatchSnapshot()
    })
    it('should generate aws ecr dockerfile images', () => {
      const output = generateFileJSON({
        prefix: 'public.ecr.aws/chainlink-staging/adapters/',
        tag: 'develop',
      })
      expect(output).toMatchSnapshot()
    })
  })
})
