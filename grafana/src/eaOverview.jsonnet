// https://grafana.com/docs/grafana/latest/dashboards/json-model/
local grafana = import 'grafonnet/grafana.libsonnet';
local graphPanel = grafana.graphPanel;
local prometheus = grafana.prometheus;

local shared = import './shared.libsonnet';
local addSideLegend = shared.helpers.addSideLegend;

local cortexDataSource = shared.constants.cortexDataSource;
local instanceFilter = shared.constants.instanceFilter;
local interval = shared.constants.interval;

local templates = shared.createTemplates(multiService=true);


/**
 * Panels
 */
local cpuUsagePanel = addSideLegend(graphPanel.new(
  title='Cpu usage percent',
  datasource=cortexDataSource,
  format='percent',
).addTarget(
  prometheus.target(
    'sum(rate(process_cpu_seconds_total{' + instanceFilter + '}' + interval + ') * 100) by (app_name)',
    legendFormat='{{app_name}}'
  )
));

local redisConnectionsOpen = addSideLegend(graphPanel.new(
  title='Redis connections open',
  sort='decreasing',
  datasource=cortexDataSource,
  format='conn',
).addTarget(
  prometheus.target(
    'sum(redis_connections_open{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}'
  )
));

local heapUsedPanel = addSideLegend(graphPanel.new(
  title='Heap usage MB',
  sort='decreasing',
  format='decmbytes',
  datasource=cortexDataSource
).addTarget(
  prometheus.target(
    'sum(nodejs_heap_size_used_bytes{' + instanceFilter + '} / 1000 / 1000) by (app_name)',
    legendFormat='{{app_name}}'
  )
));

local httpsRequestsPerMinuteQuery = 'rate(http_requests_total{' + instanceFilter + '}' + interval + ') * 60 ';
local httpsRequestsPerMinuteSumQuery = 'sum(' + httpsRequestsPerMinuteQuery + ')';


local httpRequestsPerMinutePerFeedPanel = addSideLegend(graphPanel.new(
  title='Http requests / minute per feed',
  sort='decreasing',
  datasource=cortexDataSource,
  format='req/m',
  stack=true,
  legend_min=true,
  legend_max=true,
  legend_avg=true,
).addTarget(
  prometheus.target(
    'sum(rate(http_requests_total{feed_id=~"$feed.*",' + instanceFilter + '}' + interval + ') * 60) by (feed_id, app_name)',
    legendFormat='{{app_name}} | {{feed_id}}'
  )
));

local httpRequestsPerMinutePerTypePanel = addSideLegend(graphPanel.new(
  title='Http requests / minute per type',
  sort='decreasing',
  format='req/m',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (type, app_name)',
    legendFormat='{{app_name}} | {{type}}'
  )
));
local httpRequestsPerMinutePerStatusPanel = addSideLegend(graphPanel.new(
  title='Http requests / minute per status code',
  sort='decreasing',
  datasource=cortexDataSource,
  stack=true,
  format='req/m',
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (status_code, app_name)',
    legendFormat='{{app_name}} | {{status_code}}'
  )
));

local httpRequestsPerMinutePerCacheTypePanel = addSideLegend(graphPanel.new(
  title='Http requests / minute per cache type',
  sort='decreasing',
  format='req/m',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    httpsRequestsPerMinuteSumQuery + 'by (is_cache_warming, app_name)',
    legendFormat='{{app_name}} | CacheWarmer:{{is_cache_warming}}'
  )
));
local httpRequestDurationAverageSeconds = addSideLegend(graphPanel.new(
  title='Average http request duration seconds per EA',
  datasource=cortexDataSource,
  format='s',
  sort='decreasing',
).addTarget(
  prometheus.target(
    'sum(rate(http_request_duration_seconds_sum{' + instanceFilter + '}' + interval + ') / rate(http_request_duration_seconds_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
));

local wsConnectionActiveGraph = addSideLegend(graphPanel.new(
  title='Active websocket connections per EA',
  sort='decreasing',
  format='conn',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(ws_connection_active{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  ),
));

local wsConnectionErrorsGraph = addSideLegend(graphPanel.new(
  title='Websocket connection errors per EA',
  sort='decreasing',
  format='errors',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(ws_connection_errors{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  ),
));

local wsConnectionRetriesGraph = addSideLegend(graphPanel.new(
  title='Websocket connection retries per EA',
  sort='decreasing',
  format='retries',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(ws_connection_retries{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}',
  )
));

local wsActiveSubscriptions = addSideLegend(graphPanel.new(
  title='Active websocket subscriptions per EA',
  sort='decreasing',
  format='subs',
  stack=true,
  datasource=cortexDataSource
).addTarget(
  prometheus.target(
    'sum(ws_subscription_active{' + instanceFilter + '}) by (app_name)',
    legendFormat='{{app_name}}'
  )
));

local wsMessagesPerSecondGraph = addSideLegend(graphPanel.new(
  title='Websocket messages received / second',
  sort='decreasing',
  format='msg/s',
  datasource=cortexDataSource,
  stack=true,
).addTarget(
  prometheus.target(
    'sum(rate(ws_message_total{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}'
  )
));


local cacheEntrySetsPerSecond = addSideLegend(graphPanel.new(
  title='Cache entry sets per second',
  sort='decreasing',
  format='set/s',
  stack=true,
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(rate(cache_data_set_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
));


local cacheEntryGetsPerSecond = addSideLegend(graphPanel.new(
  title='Cache entry gets per second',
  sort='decreasing',
  format='get/s',
  stack=true,
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'sum(rate(cache_data_get_count{' + instanceFilter + '}' + interval + ')) by (app_name)',
    legendFormat='{{app_name}}',
  )
));


local cacheValues = addSideLegend(graphPanel.new(
  title='$feed Cache values',
  format='none',
  datasource=cortexDataSource,
  repeat='feed',
).addSeriesOverride(
  {
    alias: '/.*Median.*/',
    color: 'rgb(255, 255, 255)',
    fill: 0,
    linewidth: 2,
    zindex: 3,
  }
).addTargets(
  [
    prometheus.target(
      'quantile(0.5, cache_data_get_values{feed_id=~"$feed.*",job="$job"}) by (feed_id)',
      legendFormat='Median',
    ),
    prometheus.target(
      'cache_data_get_values{feed_id=~"$feed.*",' + instanceFilter + '}',
      legendFormat='{{app_name}}',
    ),
  ]
));

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
  {
    panels: [cacheValues { size:: 1 }],
    height: 5,
  },
];

shared.helpers.createDashboard(templates, grid)
