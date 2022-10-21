// https://grafana.com/docs/grafana/latest/dashboards/json-model/
local grafana = import 'grafonnet/grafana.libsonnet';
local graphPanel = grafana.graphPanel;
local timeseries = grafana.timeseries;
local textPanel = grafana.text;
local prometheus = grafana.prometheus;

local shared = import './shared.libsonnet';
local addSideLegend = shared.helpers.addSideLegend;

local cortexDataSource = shared.constants.cortexDataSource;
local eaSelector = shared.constants.eaSelector;
local interval = shared.constants.interval;

local templates = shared.createTemplates(multiService=true);

/**
 * Panels
 */
local inboundRequestsNodeEAPanel = textPanel.new(
    content='# Inbound Requests (Node → EA)',
);

local ErrorRate5xxPanel = graphPanel.new(
  title='Top 10 - 5xx Error Rate',
  datasource=cortexDataSource,
  format='percent',
).addTarget(
  prometheus.target(
    'topk(10, sum by(app_name) (rate(http_requests_total{' + eaSelector + ',status_code=~"^5.."}' + interval + ')) / sum by(app_name) (rate(http_requests_total{app_name!="",' + eaSelector + '}' + interval + ')) * 100)'
  )
);

local ErrorRate4xxPanel = graphPanel.new(
  title='Top 10 - 4xx Error Rate',
  datasource=cortexDataSource,
  format='percent',
).addTarget(
  prometheus.target(
    'topk(10, sum by(app_name) (rate(http_requests_total{' + eaSelector + ',status_code=~"^4.."}' + interval + ')) / sum by(app_name) (rate(http_requests_total{app_name!="",' + eaSelector + '}' + interval + ')) * 100)'
  )
);

local Bot10CacheHitTotalReqCount = graphPanel.new(
  title='Bot 10 - (Cache Hit / Total Req Count) Ratio',
  datasource=cortexDataSource,
  format='percent',
).addTarget(
  prometheus.target(
    'bottomk(10, (sum(rate(http_requests_total{' + eaSelector + ' ,type=\"cacheHit\"}' + interval + ')) by (app_name) / sum(rate(http_requests_total{' + eaSelector + ' }' + interval + ')) by (app_name))) * 100'
  )
);

local Top10RequestDuration = graphPanel.new(
  title='Top 10 - Request duration (All envs) ',
  datasource=cortexDataSource,
  format='s',
).addTarget(
  prometheus.target(
    'topk(10, sum(rate(http_request_duration_seconds_sum{' + eaSelector + ' }' + interval + ')/rate(http_request_duration_seconds_count{' + eaSelector + ' }' + interval + ')) by (app_name))'
  )
);

local outboundRequestsNodeEAPanel = textPanel.new(
    content='# Outbound Requests (EA → DP) ',
);

local Provider5xxErrorRate = graphPanel.new(
  title='Provider 5xx Error Rate',
  datasource=cortexDataSource,
  format='req/s',
).addTarget(
  prometheus.target(
    'sum(rate(http_requests_total{' + eaSelector + ' ,provider_status_code=~"^5.."}' + interval + ')) by (app_name, provider_status_code)'
  )
);
local Provider4xxErrorRate = graphPanel.new(
  title='Provider 4xx Error Rate',
  datasource=cortexDataSource,
  format='req/s',
).addTarget(
  prometheus.target(
    'sum(rate(http_requests_total{' + eaSelector + ' ,provider_status_code=~"^4.."}' + interval + ')) by (app_name, provider_status_code)'
  )
);
local InfraResources = textPanel.new(
    content='# Infra Resources ',
);
local Top10CpuUsage = graphPanel.new(
  title='Top 10 - CPU Usage',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'topk(10, sum(rate(process_cpu_seconds_total{' + eaSelector + ' }[5m])) by (app_name) * 100)'
  )
);

local Top10CpuUsage = graphPanel.new(
  title='Top 10 - CPU Usage',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'topk(10, sum(rate(process_cpu_seconds_total{' + eaSelector + ' }[5m])) by (app_name) * 100)'
  )
);

local Top10NodeHeapUsage = graphPanel.new(
  title='Top 10 - Node.js Heap Usage (MB)',
  datasource=cortexDataSource,
  format='MB',
).addTarget(
  prometheus.target(
    'topk(10, sum (nodejs_heap_size_used_bytes{' + eaSelector + ' ,app_name!=\"REFERENCE_TRANSFORM\"} / 1000 / 1000) by (app_name))'
  )
);

local AvgCpuUsage = graphPanel.new(
  title='Avg - CPU Usage',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'avg(rate(process_cpu_seconds_total{' + eaSelector + ' }[5m])) * 100'
  )
);

local AvgNodeHeapUsage = graphPanel.new(
  title='Avg - Node.js Heap Usage (MB)',
  datasource=cortexDataSource,
  format='MB',
).addTarget(
  prometheus.target(
    'avg(nodejs_heap_size_used_bytes{' + eaSelector + ',app_name!=\"REFERENCE_TRANSFORM\"} / 1000 / 1000)'
  )
);

local InfraResources = textPanel.new(
    content=' # Adapter State',
);

local Top10WebsocketSubscriptions = graphPanel.new(
  title='Top 10 - Websocket Subscriptions',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'topk(10, sum(ws_connection_active{' + eaSelector + '}) by (app_name))'
  )
);

local Top10WebsocketSubscriptionsPerSecond = graphPanel.new(
  title='Top 10 - Websocket Subscriptions per second',
  datasource=cortexDataSource,
  format='ops/s',
).addTarget(
  prometheus.target(
    'topk(10, sum(rate(ws_subscription_active{' + eaSelector + '}' + interval + ')) by (app_name))'
  )
);

local Top10WebsocketMessages = graphPanel.new(
  title='Top 10 - Websocket Messages per second',
  datasource=cortexDataSource,
  format='req/s',
).addTarget(
  prometheus.target(
    'topk(10, sum(ws_connection_active{' + eaSelector + '}) by (app_name))'
  )
);

local Top10WebsocketErrors = graphPanel.new(
  title='Top 10 - Websocket Errors per second',
  datasource=cortexDataSource,
  format='req/s',
).addTarget(
  prometheus.target(
    'topk(10, sum(rate(ws_subscription_errors{' + eaSelector + '}' + interval + ')) by (app_name))'
  )
);

local Top10CacheWarmerSubscriptions = graphPanel.new(
  title='Top 10 - Cache Warmer Subscriptions',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'topk(10, sum(cache_warmer_get_count{' + eaSelector + '}) by (app_name))'
  )
);

local CacheWarmerErrorRate = graphPanel.new(
  title='Cache Warmer Requests Error Rate',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(rate(http_requests_total{' + eaSelector + ',is_cache_warming=\"true\",provider_status_code!=\"undefined\",provider_status_code!=\"200\"}' + interval + ')) by (app_name) / sum(rate(http_requests_total{' + eaSelector + ',is_cache_warming=\"true\"}' + interval + ')) by (app_name) * 100'
  )
);

local grid = [
  {
    panels: [
      inboundRequestsNodeEAPanel { size:: 1 },
    ],
    height: 2,
  },
  {
    panels: [
        ErrorRate5xxPanel { size:: 1 },
        ErrorRate4xxPanel { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
        Bot10CacheHitTotalReqCount { size:: 1 },
        Top10RequestDuration { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
      outboundRequestsNodeEAPanel { size:: 1 },
    ],
    height: 2,
  },
  {
    panels: [
        Provider5xxErrorRate { size:: 1 },
        Provider4xxErrorRate { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
      InfraResources { size:: 1 },
    ],
    height: 2,
  },
  {
    panels: [
        Top10CpuUsage { size:: 1 },
        Top10NodeHeapUsage { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
        AvgCpuUsage { size:: 1 },
        AvgNodeHeapUsage { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
        Top10WebsocketSubscriptions { size:: 1 },
        Top10WebsocketSubscriptionsPerSecond { size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
        Top10WebsocketMessages { size:: 1 },
        Top10WebsocketErrors{ size:: 1 },
    ],
    height:14,
  },
  {
    panels: [
        Top10CacheWarmerSubscriptions { size:: 1 },
        CacheWarmerErrorRate{ size:: 1 },
    ],
    height:14,
  },
];

shared.helpers.createDashboard(templates, grid)


