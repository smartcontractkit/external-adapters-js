'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.mockNavResponseParamsMissing =
  exports.mockNavResponseExpiredTimestamp =
  exports.mockNavResponseSupplyQueryFailed =
  exports.mockNavResponseInternalServerError =
  exports.mockNavResponseSignatureFailed =
  exports.mockNavResponseAuthenticationFailed =
  exports.mockNavResponseInvalidChainTypeAndTokenName =
  exports.mockNavResponseInvalidChainType =
  exports.mockNavResponseInvalidToken =
  exports.mockNavResponseSuccess =
    void 0
const tslib_1 = require('tslib')
const nock_1 = tslib_1.__importDefault(require('nock'))
const mockNavResponseSuccess = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R9999_9999',
      success: true,
      message: 'Success',
      data: {
        lastUpdate: '2025-11-11T16:55:53.448+00:00',
        tokenName: 'rcusd',
        chainType: 'chain',
        totalSupply: 98,
        totalAsset: 100,
        currentNav: '1.020408163265306',
      },
    })
    .persist()
exports.mockNavResponseSuccess = mockNavResponseSuccess
const mockNavResponseInvalidToken = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'invalid' })
    .reply(200, {
      code: 'R9999_0001',
      success: false,
      message: 'Invalid tokenName combination',
      data: {},
    })
exports.mockNavResponseInvalidToken = mockNavResponseInvalidToken
const mockNavResponseInvalidChainType = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'invalid', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R9999_0002',
      success: false,
      message: 'Invalid chainType combination',
      data: {},
    })
exports.mockNavResponseInvalidChainType = mockNavResponseInvalidChainType
const mockNavResponseInvalidChainTypeAndTokenName = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'invalid', tokenName: 'invalid' })
    .reply(200, {
      code: 'R9999_0001',
      success: false,
      message: 'Invalid tokenName combination',
      data: {},
    })
exports.mockNavResponseInvalidChainTypeAndTokenName = mockNavResponseInvalidChainTypeAndTokenName
const mockNavResponseAuthenticationFailed = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'optimism', tokenName: 'rcusd' })
    .reply(401, {
      error: 'authentication failed',
    })
exports.mockNavResponseAuthenticationFailed = mockNavResponseAuthenticationFailed
const mockNavResponseSignatureFailed = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'avalanche', tokenName: 'rcusd' })
    .reply(401, {
      error: 'signature failed',
    })
exports.mockNavResponseSignatureFailed = mockNavResponseSignatureFailed
const mockNavResponseInternalServerError = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'polygon', tokenName: 'rcusdp' })
    .reply(200, {
      code: 'R0005_00001',
      success: false,
      message: 'System busy, please try again later.',
      data: null,
    })
exports.mockNavResponseInternalServerError = mockNavResponseInternalServerError
const mockNavResponseSupplyQueryFailed = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'ethereum', tokenName: 'rcusd' })
    .reply(200, {
      code: 'R0000_00001',
      success: false,
      message: 'internal error',
      data: null,
    })
exports.mockNavResponseSupplyQueryFailed = mockNavResponseSupplyQueryFailed
const mockNavResponseExpiredTimestamp = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'arbitrum', tokenName: 'rcusd' })
    .reply(400, {
      error: 'expired timestamp',
    })
exports.mockNavResponseExpiredTimestamp = mockNavResponseExpiredTimestamp
const mockNavResponseParamsMissing = () =>
  (0, nock_1.default)('https://app.r25.xyz', {
    encodedQueryParams: true,
    badheaders: ['x-api-key'],
  })
    .get('/api/public/current/nav')
    .query({ chainType: 'base', tokenName: 'rcusdc' })
    .reply(400, {
      error: 'params missing',
    })
exports.mockNavResponseParamsMissing = mockNavResponseParamsMissing
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmaXh0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsd0RBQXVCO0FBRWhCLE1BQU0sc0JBQXNCLEdBQUcsR0FBZSxFQUFFLENBQ3JELElBQUEsY0FBSSxFQUFDLHFCQUFxQixFQUFFO0lBQzFCLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQztLQUNwRCxLQUFLLENBQUMsR0FBRyxFQUFFO0lBQ1YsSUFBSSxFQUFFLFlBQVk7SUFDbEIsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsU0FBUztJQUNsQixJQUFJLEVBQUU7UUFDSixVQUFVLEVBQUUsK0JBQStCO1FBQzNDLFNBQVMsRUFBRSxPQUFPO1FBQ2xCLFNBQVMsRUFBRSxPQUFPO1FBQ2xCLFdBQVcsRUFBRSxFQUFFO1FBQ2YsVUFBVSxFQUFFLEdBQUc7UUFDZixVQUFVLEVBQUUsbUJBQW1CO0tBQ2hDO0NBQ0YsQ0FBQztLQUNELE9BQU8sRUFBRSxDQUFBO0FBbkJELFFBQUEsc0JBQXNCLDBCQW1CckI7QUFFUCxNQUFNLDJCQUEyQixHQUFHLEdBQWUsRUFBRSxDQUMxRCxJQUFBLGNBQUksRUFBQyxxQkFBcUIsRUFBRTtJQUMxQixrQkFBa0IsRUFBRSxJQUFJO0NBQ3pCLENBQUM7S0FDQyxHQUFHLENBQUMseUJBQXlCLENBQUM7S0FDOUIsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDckQsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLElBQUksRUFBRSxZQUFZO0lBQ2xCLE9BQU8sRUFBRSxLQUFLO0lBQ2QsT0FBTyxFQUFFLCtCQUErQjtJQUN4QyxJQUFJLEVBQUUsRUFBRTtDQUNULENBQUMsQ0FBQTtBQVhPLFFBQUEsMkJBQTJCLCtCQVdsQztBQUVDLE1BQU0sK0JBQStCLEdBQUcsR0FBZSxFQUFFLENBQzlELElBQUEsY0FBSSxFQUFDLHFCQUFxQixFQUFFO0lBQzFCLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQztLQUNwRCxLQUFLLENBQUMsR0FBRyxFQUFFO0lBQ1YsSUFBSSxFQUFFLFlBQVk7SUFDbEIsT0FBTyxFQUFFLEtBQUs7SUFDZCxPQUFPLEVBQUUsK0JBQStCO0lBQ3hDLElBQUksRUFBRSxFQUFFO0NBQ1QsQ0FBQyxDQUFBO0FBWE8sUUFBQSwrQkFBK0IsbUNBV3RDO0FBRUMsTUFBTSwyQ0FBMkMsR0FBRyxHQUFlLEVBQUUsQ0FDMUUsSUFBQSxjQUFJLEVBQUMscUJBQXFCLEVBQUU7SUFDMUIsa0JBQWtCLEVBQUUsSUFBSTtDQUN6QixDQUFDO0tBQ0MsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0tBQzlCLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDO0tBQ3JELEtBQUssQ0FBQyxHQUFHLEVBQUU7SUFDVixJQUFJLEVBQUUsWUFBWTtJQUNsQixPQUFPLEVBQUUsS0FBSztJQUNkLE9BQU8sRUFBRSwrQkFBK0I7SUFDeEMsSUFBSSxFQUFFLEVBQUU7Q0FDVCxDQUFDLENBQUE7QUFYTyxRQUFBLDJDQUEyQywrQ0FXbEQ7QUFFQyxNQUFNLG1DQUFtQyxHQUFHLEdBQWUsRUFBRSxDQUNsRSxJQUFBLGNBQUksRUFBQyxxQkFBcUIsRUFBRTtJQUMxQixrQkFBa0IsRUFBRSxJQUFJO0NBQ3pCLENBQUM7S0FDQyxHQUFHLENBQUMseUJBQXlCLENBQUM7S0FDOUIsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUM7S0FDcEQsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLEtBQUssRUFBRSx1QkFBdUI7Q0FDL0IsQ0FBQyxDQUFBO0FBUk8sUUFBQSxtQ0FBbUMsdUNBUTFDO0FBRUMsTUFBTSw4QkFBOEIsR0FBRyxHQUFlLEVBQUUsQ0FDN0QsSUFBQSxjQUFJLEVBQUMscUJBQXFCLEVBQUU7SUFDMUIsa0JBQWtCLEVBQUUsSUFBSTtDQUN6QixDQUFDO0tBQ0MsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0tBQzlCLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDO0tBQ3JELEtBQUssQ0FBQyxHQUFHLEVBQUU7SUFDVixLQUFLLEVBQUUsa0JBQWtCO0NBQzFCLENBQUMsQ0FBQTtBQVJPLFFBQUEsOEJBQThCLGtDQVFyQztBQUVDLE1BQU0sa0NBQWtDLEdBQUcsR0FBZSxFQUFFLENBQ2pFLElBQUEsY0FBSSxFQUFDLHFCQUFxQixFQUFFO0lBQzFCLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQztLQUNwRCxLQUFLLENBQUMsR0FBRyxFQUFFO0lBQ1YsSUFBSSxFQUFFLGFBQWE7SUFDbkIsT0FBTyxFQUFFLEtBQUs7SUFDZCxPQUFPLEVBQUUsc0NBQXNDO0lBQy9DLElBQUksRUFBRSxJQUFJO0NBQ1gsQ0FBQyxDQUFBO0FBWE8sUUFBQSxrQ0FBa0Msc0NBV3pDO0FBRUMsTUFBTSxnQ0FBZ0MsR0FBRyxHQUFlLEVBQUUsQ0FDL0QsSUFBQSxjQUFJLEVBQUMscUJBQXFCLEVBQUU7SUFDMUIsa0JBQWtCLEVBQUUsSUFBSTtDQUN6QixDQUFDO0tBQ0MsR0FBRyxDQUFDLHlCQUF5QixDQUFDO0tBQzlCLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDO0tBQ3BELEtBQUssQ0FBQyxHQUFHLEVBQUU7SUFDVixJQUFJLEVBQUUsYUFBYTtJQUNuQixPQUFPLEVBQUUsS0FBSztJQUNkLE9BQU8sRUFBRSxnQkFBZ0I7SUFDekIsSUFBSSxFQUFFLElBQUk7Q0FDWCxDQUFDLENBQUE7QUFYTyxRQUFBLGdDQUFnQyxvQ0FXdkM7QUFFQyxNQUFNLCtCQUErQixHQUFHLEdBQWUsRUFBRSxDQUM5RCxJQUFBLGNBQUksRUFBQyxxQkFBcUIsRUFBRTtJQUMxQixrQkFBa0IsRUFBRSxJQUFJO0NBQ3pCLENBQUM7S0FDQyxHQUFHLENBQUMseUJBQXlCLENBQUM7S0FDOUIsS0FBSyxDQUFDLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUM7S0FDcEQsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLEtBQUssRUFBRSxtQkFBbUI7Q0FDM0IsQ0FBQyxDQUFBO0FBUk8sUUFBQSwrQkFBK0IsbUNBUXRDO0FBRUMsTUFBTSw0QkFBNEIsR0FBRyxHQUFlLEVBQUUsQ0FDM0QsSUFBQSxjQUFJLEVBQUMscUJBQXFCLEVBQUU7SUFDMUIsa0JBQWtCLEVBQUUsSUFBSTtJQUN4QixVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUM7Q0FDMUIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQztLQUNqRCxLQUFLLENBQUMsR0FBRyxFQUFFO0lBQ1YsS0FBSyxFQUFFLGdCQUFnQjtDQUN4QixDQUFDLENBQUE7QUFUTyxRQUFBLDRCQUE0QixnQ0FTbkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgbm9jayBmcm9tICdub2NrJ1xuXG5leHBvcnQgY29uc3QgbW9ja05hdlJlc3BvbnNlU3VjY2VzcyA9ICgpOiBub2NrLlNjb3BlID0+XG4gIG5vY2soJ2h0dHBzOi8vYXBwLnIyNS54eXonLCB7XG4gICAgZW5jb2RlZFF1ZXJ5UGFyYW1zOiB0cnVlLFxuICB9KVxuICAgIC5nZXQoJy9hcGkvcHVibGljL2N1cnJlbnQvbmF2JylcbiAgICAucXVlcnkoeyBjaGFpblR5cGU6ICdwb2x5Z29uJywgdG9rZW5OYW1lOiAncmN1c2RwJyB9KVxuICAgIC5yZXBseSgyMDAsIHtcbiAgICAgIGNvZGU6ICdSOTk5OV85OTk5JyxcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnU3VjY2VzcycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGxhc3RVcGRhdGU6ICcyMDI1LTExLTExVDE2OjU1OjUzLjQ0OCswMDowMCcsXG4gICAgICAgIHRva2VuTmFtZTogJ3JjdXNkJyxcbiAgICAgICAgY2hhaW5UeXBlOiAnY2hhaW4nLFxuICAgICAgICB0b3RhbFN1cHBseTogOTgsXG4gICAgICAgIHRvdGFsQXNzZXQ6IDEwMCxcbiAgICAgICAgY3VycmVudE5hdjogJzEuMDIwNDA4MTYzMjY1MzA2JyxcbiAgICAgIH0sXG4gICAgfSlcbiAgICAucGVyc2lzdCgpXG5cbmV4cG9ydCBjb25zdCBtb2NrTmF2UmVzcG9uc2VJbnZhbGlkVG9rZW4gPSAoKTogbm9jay5TY29wZSA9PlxuICBub2NrKCdodHRwczovL2FwcC5yMjUueHl6Jywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgfSlcbiAgICAuZ2V0KCcvYXBpL3B1YmxpYy9jdXJyZW50L25hdicpXG4gICAgLnF1ZXJ5KHsgY2hhaW5UeXBlOiAncG9seWdvbicsIHRva2VuTmFtZTogJ2ludmFsaWQnIH0pXG4gICAgLnJlcGx5KDIwMCwge1xuICAgICAgY29kZTogJ1I5OTk5XzAwMDEnLFxuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnSW52YWxpZCB0b2tlbk5hbWUgY29tYmluYXRpb24nLFxuICAgICAgZGF0YToge30sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IG1vY2tOYXZSZXNwb25zZUludmFsaWRDaGFpblR5cGUgPSAoKTogbm9jay5TY29wZSA9PlxuICBub2NrKCdodHRwczovL2FwcC5yMjUueHl6Jywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgfSlcbiAgICAuZ2V0KCcvYXBpL3B1YmxpYy9jdXJyZW50L25hdicpXG4gICAgLnF1ZXJ5KHsgY2hhaW5UeXBlOiAnaW52YWxpZCcsIHRva2VuTmFtZTogJ3JjdXNkcCcgfSlcbiAgICAucmVwbHkoMjAwLCB7XG4gICAgICBjb2RlOiAnUjk5OTlfMDAwMicsXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIGNoYWluVHlwZSBjb21iaW5hdGlvbicsXG4gICAgICBkYXRhOiB7fSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgbW9ja05hdlJlc3BvbnNlSW52YWxpZENoYWluVHlwZUFuZFRva2VuTmFtZSA9ICgpOiBub2NrLlNjb3BlID0+XG4gIG5vY2soJ2h0dHBzOi8vYXBwLnIyNS54eXonLCB7XG4gICAgZW5jb2RlZFF1ZXJ5UGFyYW1zOiB0cnVlLFxuICB9KVxuICAgIC5nZXQoJy9hcGkvcHVibGljL2N1cnJlbnQvbmF2JylcbiAgICAucXVlcnkoeyBjaGFpblR5cGU6ICdpbnZhbGlkJywgdG9rZW5OYW1lOiAnaW52YWxpZCcgfSlcbiAgICAucmVwbHkoMjAwLCB7XG4gICAgICBjb2RlOiAnUjk5OTlfMDAwMScsXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHRva2VuTmFtZSBjb21iaW5hdGlvbicsXG4gICAgICBkYXRhOiB7fSxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgbW9ja05hdlJlc3BvbnNlQXV0aGVudGljYXRpb25GYWlsZWQgPSAoKTogbm9jay5TY29wZSA9PlxuICBub2NrKCdodHRwczovL2FwcC5yMjUueHl6Jywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgfSlcbiAgICAuZ2V0KCcvYXBpL3B1YmxpYy9jdXJyZW50L25hdicpXG4gICAgLnF1ZXJ5KHsgY2hhaW5UeXBlOiAnb3B0aW1pc20nLCB0b2tlbk5hbWU6ICdyY3VzZCcgfSlcbiAgICAucmVwbHkoNDAxLCB7XG4gICAgICBlcnJvcjogJ2F1dGhlbnRpY2F0aW9uIGZhaWxlZCcsXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IG1vY2tOYXZSZXNwb25zZVNpZ25hdHVyZUZhaWxlZCA9ICgpOiBub2NrLlNjb3BlID0+XG4gIG5vY2soJ2h0dHBzOi8vYXBwLnIyNS54eXonLCB7XG4gICAgZW5jb2RlZFF1ZXJ5UGFyYW1zOiB0cnVlLFxuICB9KVxuICAgIC5nZXQoJy9hcGkvcHVibGljL2N1cnJlbnQvbmF2JylcbiAgICAucXVlcnkoeyBjaGFpblR5cGU6ICdhdmFsYW5jaGUnLCB0b2tlbk5hbWU6ICdyY3VzZCcgfSlcbiAgICAucmVwbHkoNDAxLCB7XG4gICAgICBlcnJvcjogJ3NpZ25hdHVyZSBmYWlsZWQnLFxuICAgIH0pXG5cbmV4cG9ydCBjb25zdCBtb2NrTmF2UmVzcG9uc2VJbnRlcm5hbFNlcnZlckVycm9yID0gKCk6IG5vY2suU2NvcGUgPT5cbiAgbm9jaygnaHR0cHM6Ly9hcHAucjI1Lnh5eicsIHtcbiAgICBlbmNvZGVkUXVlcnlQYXJhbXM6IHRydWUsXG4gIH0pXG4gICAgLmdldCgnL2FwaS9wdWJsaWMvY3VycmVudC9uYXYnKVxuICAgIC5xdWVyeSh7IGNoYWluVHlwZTogJ3BvbHlnb24nLCB0b2tlbk5hbWU6ICdyY3VzZHAnIH0pXG4gICAgLnJlcGx5KDIwMCwge1xuICAgICAgY29kZTogJ1IwMDA1XzAwMDAxJyxcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogJ1N5c3RlbSBidXN5LCBwbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicsXG4gICAgICBkYXRhOiBudWxsLFxuICAgIH0pXG5cbmV4cG9ydCBjb25zdCBtb2NrTmF2UmVzcG9uc2VTdXBwbHlRdWVyeUZhaWxlZCA9ICgpOiBub2NrLlNjb3BlID0+XG4gIG5vY2soJ2h0dHBzOi8vYXBwLnIyNS54eXonLCB7XG4gICAgZW5jb2RlZFF1ZXJ5UGFyYW1zOiB0cnVlLFxuICB9KVxuICAgIC5nZXQoJy9hcGkvcHVibGljL2N1cnJlbnQvbmF2JylcbiAgICAucXVlcnkoeyBjaGFpblR5cGU6ICdldGhlcmV1bScsIHRva2VuTmFtZTogJ3JjdXNkJyB9KVxuICAgIC5yZXBseSgyMDAsIHtcbiAgICAgIGNvZGU6ICdSMDAwMF8wMDAwMScsXG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdpbnRlcm5hbCBlcnJvcicsXG4gICAgICBkYXRhOiBudWxsLFxuICAgIH0pXG5cbmV4cG9ydCBjb25zdCBtb2NrTmF2UmVzcG9uc2VFeHBpcmVkVGltZXN0YW1wID0gKCk6IG5vY2suU2NvcGUgPT5cbiAgbm9jaygnaHR0cHM6Ly9hcHAucjI1Lnh5eicsIHtcbiAgICBlbmNvZGVkUXVlcnlQYXJhbXM6IHRydWUsXG4gIH0pXG4gICAgLmdldCgnL2FwaS9wdWJsaWMvY3VycmVudC9uYXYnKVxuICAgIC5xdWVyeSh7IGNoYWluVHlwZTogJ2FyYml0cnVtJywgdG9rZW5OYW1lOiAncmN1c2QnIH0pXG4gICAgLnJlcGx5KDQwMCwge1xuICAgICAgZXJyb3I6ICdleHBpcmVkIHRpbWVzdGFtcCcsXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IG1vY2tOYXZSZXNwb25zZVBhcmFtc01pc3NpbmcgPSAoKTogbm9jay5TY29wZSA9PlxuICBub2NrKCdodHRwczovL2FwcC5yMjUueHl6Jywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgICBiYWRoZWFkZXJzOiBbJ3gtYXBpLWtleSddLFxuICB9KVxuICAgIC5nZXQoJy9hcGkvcHVibGljL2N1cnJlbnQvbmF2JylcbiAgICAucXVlcnkoeyBjaGFpblR5cGU6ICdiYXNlJywgdG9rZW5OYW1lOiAncmN1c2RjJyB9KVxuICAgIC5yZXBseSg0MDAsIHtcbiAgICAgIGVycm9yOiAncGFyYW1zIG1pc3NpbmcnLFxuICAgIH0pXG4iXX0=
