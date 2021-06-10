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
  title: std.extVar('overviewDashboardTitle'),
  uid: std.extVar('overviewDashboardUid'),
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
  current='All',
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
  format='percent',
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(rate(process_cpu_seconds_total{' + instanceFilter + '}' + interval + ')* 100) by (app_name)',
    legendFormat='{{app_name}}'
  )
);

local redisConnectionsOpen = graphPanel.new(
  title='Redis connections open',
  sort='decreasing',
  datasource=cortexDataSource,
  format='conn',
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(redis_connections_open{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}'
  )
);

local heapUsedPanel = graphPanel.new(
  title='Heap usage MB',
  sort='decreasing',
  format='decmbytes',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(nodejs_heap_size_used_bytes{' + instanceFilter + '} / 1000 / 1000) by (app_name)',
    legendFormat='{{app_name}}'
  )
);

local httpsRequestsPerMinuteQuery = 'rate(http_requests_total{' + instanceFilter + '}' + interval + ') * 60 ';
local httpsRequestsPerMinuteSumQuery = 'sum(' + httpsRequestsPerMinuteQuery + ')';


local httpRequestsPerMinutePerFeedPanel = graphPanel.new(
  title='Http requests / minute per feed',
  sort='decreasing',
  datasource=cortexDataSource,
  format='req/m',
  stack=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_min=true,
  legend_max=true,
  legend_avg=true,
  legend_sort='current',
  legend_sortDesc=true
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (feed_id, app_name)',
    legendFormat='{{app_name}} | {{feed_id}}'
  )
);

local httpRequestsPerMinutePerTypePanel = graphPanel.new(
  title='Http requests / minute per type',
  sort='decreasing',
  format='req/m',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (type, app_name)',
    legendFormat='{{app_name}} | {{type}}'
  )
);
local httpRequestsPerMinutePerStatusPanel = graphPanel.new(
  title='Http requests / minute per status code',
  sort='decreasing',
  datasource=cortexDataSource,
  stack=true,
  format='req/m',
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (status_code, app_name)',
    legendFormat='{{app_name}} | {{status_code}}'
  )
);

local httpRequestsPerMinutePerCacheTypePanel = graphPanel.new(
  title='Http requests / minute per cache type',
  sort='decreasing',
  format='req/m',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (is_cache_warming, app_name)',
    legendFormat='{{app_name}} | CacheWarmer:{{is_cache_warming}}'
  )
);
local httpRequestDurationAverageSeconds = graphPanel.new(
  title='Average http request duration seconds per EA',
  datasource=cortexDataSource,
  format='s',
  sort='decreasing',
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(rate(http_request_duration_seconds_sum{' + instanceFilter + '}' + interval + ')/rate(http_request_duration_seconds_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
);

local wsConnectionActiveGraph = graphPanel.new(
  title='Active websocket connections per EA',
  sort='decreasing',
  format='conn',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(ws_connection_active{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  ),
);

local wsConnectionErrorsGraph = graphPanel.new(
  title='Websocket connection errors per EA',
  sort='decreasing',
  format='errors',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(ws_connection_errors{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  ),
);

local wsConnectionRetriesGraph = graphPanel.new(
  title='Websocket connection retries per EA',
  sort='decreasing',
  format='retries',
  datasource=cortexDataSource,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
).addTarget(
  prometheus.target(
    'sum(ws_connection_retries{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  )
);

local wsActiveSubscriptions = graphPanel.new(
  title='Active websocket subscriptions per EA',
  sort='decreasing',
  format='subs',
  stack=true,
  legend_alignAsTable=true,
  legend_rightSide=true,
  legend_current=true,
  legend_values=true,
  legend_sort='current',
  legend_sortDesc=true,
  datasource=cortexDataSource
).addTarget(
  prometheus.target(
    'sum(ws_subscription_active{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}'
  )
);

local wsMessagesPerSecondGraph = graphPanel.new(
  title='Websocket messages received / second',
  sort='decreasing',
  format='msg/s',
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
    'sum(rate(ws_message_total{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}'
  )
);


local cacheEntrySetsPerSecond = graphPanel.new(
  title='Cache entry sets per second',
  sort='decreasing',
  format='set/s',
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
    'sum(rate(cache_data_set_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
);


local cacheEntryGetsPerSecond = graphPanel.new(
  title='Cache entry gets per second',
  sort='decreasing',
  format='get/s',
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
    'sum(rate(cache_data_get_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
);

local grid = [
  {
    panels: [
      cpuUsagePanel { size:: 1 },
      heapUsedPanel { size:: 1 },
    ],
    height: 10,
  },
  {
    panels: [
      httpRequestsPerMinutePerFeedPanel { size:: 1 },
    ],
    height: 15,
  },
  {
    panels: [
      httpRequestDurationAverageSeconds { size:: 1 },
    ],
    height: 10,
  },
  {
    panels: [
      httpRequestsPerMinutePerTypePanel { size:: 1 },
      httpRequestsPerMinutePerStatusPanel { size:: 1 },
      httpRequestsPerMinutePerCacheTypePanel { size:: 1 },
    ],
    height: 10,
  },
  {
    panels: [
      redisConnectionsOpen { size:: 1 },
      wsConnectionActiveGraph { size:: 1 },
      wsConnectionErrorsGraph { size:: 1 },
      wsConnectionRetriesGraph { size:: 1 },
    ],
    height: 10,
  },
  {
    panels: [
      wsActiveSubscriptions { size:: 1 },
      wsMessagesPerSecondGraph { size:: 1 },
    ],
    height: 10,
  },

  {
    panels: [
      cacheEntrySetsPerSecond { size:: 1 },
      cacheEntryGetsPerSecond { size:: 1 },
    ],
    height: 10,
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
