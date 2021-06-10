// https://grafana.com/docs/grafana/latest/dashboards/json-model/
local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local graphPanel = grafana.graphPanel;
local statPanel = grafana.statPanel;
local heatmapPanel = grafana.heatmapPanel;
local barGaugePanel = grafana.barGaugePanel;
local prometheus = grafana.prometheus;
local template = grafana.template;
local layout = import './layout.libsonnet';

/**
 * Constants
 */
local prometheusJobName = std.extVar('prometheusJobName');
local cortexDataSource = std.extVar('cortexDataSource');
local dashboardConfig = {
  title: std.extVar('dashboardTitle'),
  uid: std.extVar('dashboardUid'),
};
local instanceFilter = 'job="$job",service=~"$service.*"';

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
local interval = '[$__rate_interval]';
local cpuUsagePanel = graphPanel.new(
  title='Cpu usage percent',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(rate(process_cpu_seconds_total{' + instanceFilter + '}' + interval + ')) * 100',
    legendFormat='{{app_name}}'
  )
);

local redisConnectionsOpen = graphPanel.new(
  title='Redis connections open',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'redis_connections_open{' + instanceFilter + '}',
    legendFormat='{{app_name}}'
  )
);

local heapUsedPanel = graphPanel.new(
  title='Heap usage MB',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'nodejs_heap_size_used_bytes{' + instanceFilter + '} / 1000 / 1000',
    legendFormat='{{app_name}}'
  )
);

local httpsRequestsPerMinuteQuery = 'rate(http_requests_total{' + instanceFilter + '}' + interval + ') * 60 ';
local httpsRequestsPerMinuteSumQuery = 'sum(' + httpsRequestsPerMinuteQuery + ')';


local httpRequestsPerMinutePanel = graphPanel.new(
  title='Http requests / minute',
  sort='decreasing',
  datasource=cortexDataSource,
  stack=true,
  legend_hideZero=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteQuery,
    legendFormat='{{app_name}}-{{feed_id}}-{{status_code}}-{{type}}-cacheWarmer:{{is_cache_warming}}'
  )
);
local httpRequestsPerMinutePerTypePanel = graphPanel.new(
  title='Http requests / minute per type',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (type)',
    legendFormat='{{type}}'
  )
);
local httpRequestsPerMinutePerStatusPanel = graphPanel.new(
  title='Http requests / minute per status code',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (status_code)',
    legendFormat='{{status_code}}'
  )
);
local httpRequestsPerMinutePerFeedPanel = graphPanel.new(
  title='Http requests / minute per feed',
  sort='decreasing',
  datasource=cortexDataSource,
  stack=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (feed_id)',
    legendFormat='{{feed_id}}'
  )
);
local httpRequestsPerMinutePerCacheTypePanel = graphPanel.new(
  title='Http requests / minute per cache type',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (is_cache_warming)',
    legendFormat='From cache warmer: {{is_cache_warming}}'
  )
);


local httpRequestDurationAverageSeconds = graphPanel.new(
  title='Average http request duration seconds',
  datasource=cortexDataSource,
  sort='decreasing',
).addTarget(
  prometheus.target(
    'rate(http_request_duration_seconds_sum{' + instanceFilter + '}' + interval + ')/rate(http_request_duration_seconds_count{' + instanceFilter + '}' + interval + ')',
    legendFormat='{{app_name}}',
  )
);
local httpRequestDurationSecondsHeatmap = heatmapPanel.new(
  title='Http request duration seconds heatmap',
  datasource=cortexDataSource,
  dataFormat='tsbuckets',
  color_colorScheme='interpolateInferno',
  maxDataPoints=25,
  yAxis_logBase=2,
).addTarget(
  prometheus.target(
    'sum(increase(http_request_duration_seconds_bucket{' + instanceFilter + '}[$__interval])) by (le)',
    legendFormat='{{le}}',
    format='heatmap',
  )
);

local wsConnectionActiveGraph = graphPanel.new(
  title='Active websocket connections',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_active{' + instanceFilter + '}',
    legendFormat='{{app_name}} | Key:{{key}}',
  ),
);

local wsConnectionErrorsGraph = graphPanel.new(
  title='Websocket connection errors',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_errors{' + instanceFilter + '}',
    legendFormat='{{app_name}} | Key:{{key}}',
  ),
);

local wsConnectionRetriesGraph = graphPanel.new(
  title='Websocket connection retries',
  sort='decreasing',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'ws_connection_retries{' + instanceFilter + '}',

    legendFormat='{{app_name}} | Key:{{key}}',
  )
);

local wsActiveSubscriptions = graphPanel.new(
  title='Active websocket subscriptions',
  sort='decreasing',
  stack=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_sort='current',
  legend_sortDesc=true,
  datasource=cortexDataSource
).addTarget(
  prometheus.target(
    'ws_subscription_active{' + instanceFilter + '}',
    legendFormat='{{app_name}} | ConnKey: {{ connection_key }} ConnUrl: {{ connection_url }} FeedId: {{feed_id}}'
  )
);

local wsMessagesPerSecondGraph = graphPanel.new(
  title='Websocket messages received / second',
  sort='decreasing',
  datasource=cortexDataSource,
  stack=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true
).addTarget(
  prometheus.target(
    'rate(ws_message_total{' + instanceFilter + '}' + interval + ')',
    legendFormat='{{app_name}} | ConnKey: {{ connection_key }} ConnUrl: {{ connection_url }} FeedId: {{feed_id}}'
  )
);

local cacheFeedValues = statPanel.new(
  title='Cached feed values',
  datasource=cortexDataSource,
  reducerFunction='lastNotNull',
  unit='short'
).addTarget(
  prometheus.target(
    'cache_data_get_values{' + instanceFilter + '}',
    legendFormat='{{feed_id}}',
  )
);

local barGaugeConfig = {
  fieldConfig+: {
    defaults+: {
      color: {
        mode: 'continuous-GrYlRd',
      },
    },
  },
  options: {
    reduceOptions: {
      values: false,
      calcs: [
        'lastNotNull',
      ],
      fields: '',
    },
    orientation: 'horizontal',
    text: {},
    displayMode: 'gradient',
    showUnfilled: true,
  },
};

local cacheMaxAgeSeconds = barGaugePanel.new(
  title='Max age per cache entry',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sort_desc(cache_data_max_age{' + instanceFilter + '}/1000) != 0',
    instant=true,
    legendFormat='{{feed_id}}',
  )
) + barGaugeConfig;

local cacheStalenessSeconds = barGaugePanel.new(
  title='Staleness per cache entry',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sort_desc(cache_data_staleness_seconds{' + instanceFilter + '}) != 0',
    instant=true,
    legendFormat='{{feed_id}}',
  )
) + barGaugeConfig;

local cacheEntrySetsPerSecond = graphPanel.new(
  title='Cache entry sets per second',
  sort='decreasing',
  stack=true,
  datasource=cortexDataSource,
  legend_hideZero=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_sort='current',
  legend_sortDesc=true,
  legend_values=true,
).addTarget(
  prometheus.target(
    'rate(cache_data_set_count{' + instanceFilter + '}' + interval + ')',
    legendFormat='{{feed_id}}',
  )
);


local cacheEntryGetsPerSecond = graphPanel.new(
  title='Cache entry gets per second',
  sort='decreasing',
  stack=true,
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_sort='current',
  legend_sortDesc=true,
  legend_values=true,
).addTarget(
  prometheus.target(
    'rate(cache_data_get_count{' + instanceFilter + '}' + interval + ')',
    legendFormat='{{feed_id}}',
  )
);

local grid = [
  {
    panels: [
      cpuUsagePanel { size:: 1 },
      heapUsedPanel { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [httpRequestsPerMinutePanel { size:: 1 }],
    height: 7.5,
  },
  {
    panels: [
      httpRequestDurationAverageSeconds { size:: 1 },
      httpRequestDurationSecondsHeatmap { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [
      httpRequestsPerMinutePerTypePanel { size:: 1 },
      httpRequestsPerMinutePerStatusPanel { size:: 1 },
      httpRequestsPerMinutePerFeedPanel { size:: 1 },
      httpRequestsPerMinutePerCacheTypePanel { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [
      redisConnectionsOpen { size:: 1 },
      wsConnectionActiveGraph { size:: 1 },
      wsConnectionErrorsGraph { size:: 1 },
      wsConnectionRetriesGraph { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [
      wsActiveSubscriptions { size:: 1 },
      wsMessagesPerSecondGraph { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [
      cacheFeedValues { size:: 1 },
    ],
    height: 12.5,
  },
  {
    panels: [
      cacheMaxAgeSeconds { size:: 1 },
      cacheStalenessSeconds { size:: 1 },
    ],
    height: 7.5,
  },
  {
    panels: [
      cacheEntrySetsPerSecond { size:: 1 },
      cacheEntryGetsPerSecond { size:: 1 },
    ],
    height: 7.5,
  },
];


{
  dashboard: dashboard.new(
    dashboardConfig.title,
    uid=dashboardConfig.uid,
    editable=true,
    schemaVersion=26,
    refresh='5s',
  )
             .addTemplates(templates)
             .addPanels(layout.createGrid(grid)),

  name: prometheusJobName,
}
