// https://grafana.com/docs/grafana/latest/dashboards/json-model/
local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local graphPanel = grafana.graphPanel;
local heatmapPanel = grafana.heatmapPanel;
local prometheus = grafana.prometheus;
local template = grafana.template;

/**
 * Constants
 */
local prometheusJobName = std.extVar('prometheusJobName');
local cortexDataSource = std.extVar('cortexDataSource');
local dashboardConfig = {
  title: std.extVar('dashboardTitle'),
  uid: std.extVar('dashboardUid'),
};
local instanceFilter = 'job="$job", service=~"$service.*"';

/**
 * Templates
 */
local jobTempl = template.custom('job', query=prometheusJobName, current=prometheusJobName, hide=true);
local serviceTempl = template.new(
  'service',
  datasource=cortexDataSource,
  query='http_request_duration_seconds_bucket',
  multi=true,
  sort=1,
  current='all',
  regex='/.*job="' + prometheusJobName + '".*service="(.*)"/',
  includeAll=true,
  refresh='load'
);
local templates = [jobTempl, serviceTempl];

/**
 * Panels
 */
local cpuUsagePanel = graphPanel.new(
  title='Cpu usage percent',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(rate(process_cpu_seconds_total{' + instanceFilter + '}[$__rate_interval])) * 100'
  )
);

local redisConnectionsOpen = graphPanel.new(
  title='Redis connections open',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'redis_connections_open{' + instanceFilter + '}'
  )
);

local heapUsedPanel = graphPanel.new(
  title='Heap usage MB',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'nodejs_heap_size_used_bytes{' + instanceFilter + '} / 1000 / 1000'
  )
);

local totalHttpRequestsPanel = graphPanel.new(
  title='Http requests / second',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'rate(http_requests_total{' + instanceFilter + '}[$__rate_interval])',
    legendFormat='{{app_name}}-{{status_code}}-{{type}}-cacheWamer:{{isCacheWarming}}'
  )
);
local httpRequestDurationAverage = graphPanel.new(
  title='Average http request duration',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'rate(http_request_duration_seconds_sum{' + instanceFilter + '}[$__rate_interval])/rate(http_request_duration_seconds_count{' + instanceFilter + '}[$__rate_interval])',
    legendFormat='{{app_name}}',
  )
);
local httpRequestDurationHeatmap = heatmapPanel.new(
  title='Http request duration heatmap',
  datasource=cortexDataSource,
  dataFormat='tsbuckets',
  color_colorScheme='interpolateInferno',
  maxDataPoints=25,
  yAxis_logBase=2
).addTarget(
  prometheus.target(
    'sum(increase(http_request_duration_seconds_bucket{' + instanceFilter + '}[$__interval])) by (le)',
    legendFormat='{{le}}',
    format='heatmap',
  )
);

local wsConnectionActiveGraph = graphPanel.new(
  title='Active websocket connections',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_active{' + instanceFilter + '}',
    legendFormat='{{app_name}} | Key:{{key}}',
  ),
);

local wsConnectionErrorsGraph = graphPanel.new(
  title='Websocket connection errors',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_errors{' + instanceFilter + '}',
    legendFormat='{{app_name}} | Key:{{key}}',
  ),
);

local wsConnectionRetriesGraph = graphPanel.new(
  title='Websocket connection retries',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_retries{' + instanceFilter + '}',
    legendFormat='{{app_name}} | Key:{{key}}',
  )
);

local wsActiveSubscriptions = graphPanel.new(
  title='Active websocket subscriptions',
  datasource=cortexDataSource
).addTarget(
  prometheus.target(
    'ws_subscription_active{' + instanceFilter + '}',
    legendFormat='{{app_name}} | ConnKey: {{ connection_key }} ConnUrl: {{ connection_url }} FeedId: {{feed_id}} SubKey: {{ subscription_key }}'
  )
);

local wsMessagesPerSecondGraph = graphPanel.new(
  title='Websocket messages received / second',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'rate(ws_message_total{' + instanceFilter + '}[$__rate_interval])',
    legendFormat='{{app_name}} | ConnKey: {{ connection_key }} ConnUrl: {{ connection_url }} FeedId: {{feed_id}} SubKey: {{ subscription_key }}'
  )
);


local panelSize1 = {
  gridPos+: {
    w: 24,  // The dashboard width is divided into 24 sections, we want to take up the entire row
    h: 10,  // Height is 30 px per unit
  },
};

local panels = [
  cpuUsagePanel + panelSize1,
  redisConnectionsOpen + panelSize1,
  heapUsedPanel + panelSize1,
  totalHttpRequestsPanel + panelSize1,
  httpRequestDurationAverage + panelSize1,
  httpRequestDurationHeatmap + panelSize1,
  wsConnectionActiveGraph + panelSize1,
  wsConnectionErrorsGraph + panelSize1,
  wsConnectionRetriesGraph + panelSize1,
  wsActiveSubscriptions + panelSize1,
  wsMessagesPerSecondGraph + panelSize1,
];


{
  dashboard: dashboard.new(
    dashboardConfig.title,
    uid=dashboardConfig.uid,
    editable=true,
    schemaVersion=26
  )
             .addTemplates(templates)
             .addPanels(panels),

  name: prometheusJobName,
}
