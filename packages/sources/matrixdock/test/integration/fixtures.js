'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.mockNavResponseCustomSymbol =
  exports.mockNavResponseInternalServerError =
  exports.mockNavResponseInvalidSymbol =
  exports.mockNavResponseSuccess =
    void 0
const tslib_1 = require('tslib')
const nock_1 = tslib_1.__importDefault(require('nock'))
const mockNavResponseSuccess = () =>
  (0, nock_1.default)('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAUM' })
    .reply(200, {
      code: 0,
      message: 'success',
      data: {
        round_id: '7424696115074699264',
        last_updated_timestamp: 1770185497979,
        symbol: 'XAUM',
        issue_price: '5115.355',
        redeem_price: '5037.982',
      },
    })
exports.mockNavResponseSuccess = mockNavResponseSuccess
const mockNavResponseInvalidSymbol = () =>
  (0, nock_1.default)('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'UNKNOWN' })
    .reply(200, {
      code: 1001,
      message: 'Invalid symbol',
      data: null,
    })
exports.mockNavResponseInvalidSymbol = mockNavResponseInvalidSymbol
const mockNavResponseInternalServerError = () =>
  (0, nock_1.default)('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAUM_ERROR' })
    .reply(200, {
      code: 5001,
      message: 'System busy, please try again later.',
      data: null,
    })
exports.mockNavResponseInternalServerError = mockNavResponseInternalServerError
const mockNavResponseCustomSymbol = () =>
  (0, nock_1.default)('https://mapi.matrixport.com', {
    encodedQueryParams: true,
  })
    .get('/rwa/api/v1/quote/price')
    .query({ symbol: 'XAGU' })
    .reply(200, {
      code: 0,
      message: 'success',
      data: {
        round_id: '7424696115074699265',
        last_updated_timestamp: 1770185497980,
        symbol: 'XAGU',
        issue_price: '28.50',
        redeem_price: '28.25',
      },
    })
exports.mockNavResponseCustomSymbol = mockNavResponseCustomSymbol
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZml4dHVyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmaXh0dXJlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsd0RBQXVCO0FBRWhCLE1BQU0sc0JBQXNCLEdBQUcsR0FBZSxFQUFFLENBQ3JELElBQUEsY0FBSSxFQUFDLDZCQUE2QixFQUFFO0lBQ2xDLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7S0FDekIsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLElBQUksRUFBRSxDQUFDO0lBQ1AsT0FBTyxFQUFFLFNBQVM7SUFDbEIsSUFBSSxFQUFFO1FBQ0osUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixzQkFBc0IsRUFBRSxhQUFhO1FBQ3JDLE1BQU0sRUFBRSxNQUFNO1FBQ2QsV0FBVyxFQUFFLFVBQVU7UUFDdkIsWUFBWSxFQUFFLFVBQVU7S0FDekI7Q0FDRixDQUFDLENBQUE7QUFoQk8sUUFBQSxzQkFBc0IsMEJBZ0I3QjtBQUVDLE1BQU0sNEJBQTRCLEdBQUcsR0FBZSxFQUFFLENBQzNELElBQUEsY0FBSSxFQUFDLDZCQUE2QixFQUFFO0lBQ2xDLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLENBQUM7S0FDNUIsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsT0FBTyxFQUFFLGdCQUFnQjtJQUN6QixJQUFJLEVBQUUsSUFBSTtDQUNYLENBQUMsQ0FBQTtBQVZPLFFBQUEsNEJBQTRCLGdDQVVuQztBQUVDLE1BQU0sa0NBQWtDLEdBQUcsR0FBZSxFQUFFLENBQ2pFLElBQUEsY0FBSSxFQUFDLDZCQUE2QixFQUFFO0lBQ2xDLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLENBQUM7S0FDL0IsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsT0FBTyxFQUFFLHNDQUFzQztJQUMvQyxJQUFJLEVBQUUsSUFBSTtDQUNYLENBQUMsQ0FBQTtBQVZPLFFBQUEsa0NBQWtDLHNDQVV6QztBQUVDLE1BQU0sMkJBQTJCLEdBQUcsR0FBZSxFQUFFLENBQzFELElBQUEsY0FBSSxFQUFDLDZCQUE2QixFQUFFO0lBQ2xDLGtCQUFrQixFQUFFLElBQUk7Q0FDekIsQ0FBQztLQUNDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQztLQUM5QixLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7S0FDekIsS0FBSyxDQUFDLEdBQUcsRUFBRTtJQUNWLElBQUksRUFBRSxDQUFDO0lBQ1AsT0FBTyxFQUFFLFNBQVM7SUFDbEIsSUFBSSxFQUFFO1FBQ0osUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixzQkFBc0IsRUFBRSxhQUFhO1FBQ3JDLE1BQU0sRUFBRSxNQUFNO1FBQ2QsV0FBVyxFQUFFLE9BQU87UUFDcEIsWUFBWSxFQUFFLE9BQU87S0FDdEI7Q0FDRixDQUFDLENBQUE7QUFoQk8sUUFBQSwyQkFBMkIsK0JBZ0JsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBub2NrIGZyb20gJ25vY2snXG5cbmV4cG9ydCBjb25zdCBtb2NrTmF2UmVzcG9uc2VTdWNjZXNzID0gKCk6IG5vY2suU2NvcGUgPT5cbiAgbm9jaygnaHR0cHM6Ly9tYXBpLm1hdHJpeHBvcnQuY29tJywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgfSlcbiAgICAuZ2V0KCcvcndhL2FwaS92MS9xdW90ZS9wcmljZScpXG4gICAgLnF1ZXJ5KHsgc3ltYm9sOiAnWEFVTScgfSlcbiAgICAucmVwbHkoMjAwLCB7XG4gICAgICBjb2RlOiAwLFxuICAgICAgbWVzc2FnZTogJ3N1Y2Nlc3MnLFxuICAgICAgZGF0YToge1xuICAgICAgICByb3VuZF9pZDogJzc0MjQ2OTYxMTUwNzQ2OTkyNjQnLFxuICAgICAgICBsYXN0X3VwZGF0ZWRfdGltZXN0YW1wOiAxNzcwMTg1NDk3OTc5LFxuICAgICAgICBzeW1ib2w6ICdYQVVNJyxcbiAgICAgICAgaXNzdWVfcHJpY2U6ICc1MTE1LjM1NScsXG4gICAgICAgIHJlZGVlbV9wcmljZTogJzUwMzcuOTgyJyxcbiAgICAgIH0sXG4gICAgfSlcblxuZXhwb3J0IGNvbnN0IG1vY2tOYXZSZXNwb25zZUludmFsaWRTeW1ib2wgPSAoKTogbm9jay5TY29wZSA9PlxuICBub2NrKCdodHRwczovL21hcGkubWF0cml4cG9ydC5jb20nLCB7XG4gICAgZW5jb2RlZFF1ZXJ5UGFyYW1zOiB0cnVlLFxuICB9KVxuICAgIC5nZXQoJy9yd2EvYXBpL3YxL3F1b3RlL3ByaWNlJylcbiAgICAucXVlcnkoeyBzeW1ib2w6ICdVTktOT1dOJyB9KVxuICAgIC5yZXBseSgyMDAsIHtcbiAgICAgIGNvZGU6IDEwMDEsXG4gICAgICBtZXNzYWdlOiAnSW52YWxpZCBzeW1ib2wnLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgbW9ja05hdlJlc3BvbnNlSW50ZXJuYWxTZXJ2ZXJFcnJvciA9ICgpOiBub2NrLlNjb3BlID0+XG4gIG5vY2soJ2h0dHBzOi8vbWFwaS5tYXRyaXhwb3J0LmNvbScsIHtcbiAgICBlbmNvZGVkUXVlcnlQYXJhbXM6IHRydWUsXG4gIH0pXG4gICAgLmdldCgnL3J3YS9hcGkvdjEvcXVvdGUvcHJpY2UnKVxuICAgIC5xdWVyeSh7IHN5bWJvbDogJ1hBVU1fRVJST1InIH0pXG4gICAgLnJlcGx5KDIwMCwge1xuICAgICAgY29kZTogNTAwMSxcbiAgICAgIG1lc3NhZ2U6ICdTeXN0ZW0gYnVzeSwgcGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICB9KVxuXG5leHBvcnQgY29uc3QgbW9ja05hdlJlc3BvbnNlQ3VzdG9tU3ltYm9sID0gKCk6IG5vY2suU2NvcGUgPT5cbiAgbm9jaygnaHR0cHM6Ly9tYXBpLm1hdHJpeHBvcnQuY29tJywge1xuICAgIGVuY29kZWRRdWVyeVBhcmFtczogdHJ1ZSxcbiAgfSlcbiAgICAuZ2V0KCcvcndhL2FwaS92MS9xdW90ZS9wcmljZScpXG4gICAgLnF1ZXJ5KHsgc3ltYm9sOiAnWEFHVScgfSlcbiAgICAucmVwbHkoMjAwLCB7XG4gICAgICBjb2RlOiAwLFxuICAgICAgbWVzc2FnZTogJ3N1Y2Nlc3MnLFxuICAgICAgZGF0YToge1xuICAgICAgICByb3VuZF9pZDogJzc0MjQ2OTYxMTUwNzQ2OTkyNjUnLFxuICAgICAgICBsYXN0X3VwZGF0ZWRfdGltZXN0YW1wOiAxNzcwMTg1NDk3OTgwLFxuICAgICAgICBzeW1ib2w6ICdYQUdVJyxcbiAgICAgICAgaXNzdWVfcHJpY2U6ICcyOC41MCcsXG4gICAgICAgIHJlZGVlbV9wcmljZTogJzI4LjI1JyxcbiAgICAgIH0sXG4gICAgfSlcbiJdfQ==
