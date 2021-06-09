// https://grafana.com/docs/grafana/latest/dashboards/json-model/
local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local graphPanel = grafana.graphPanel;
local statPanel = grafana.statPanel;
local heatmapPanel = grafana.heatmapPanel;
local barGaugePanel = grafana.barGaugePanel;
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

local fullPanel = {
  gridPos+: {
    w: 24,  // The dashboard width is divided into 24 sections
    h: 10,  // Height is 30 px per unit
  },
};

local halfPanel = {
  gridPos+: {
    w: 24 / 2,  // The dashboard width is divided into 24 sections
    h: 10,  // Height is 30 px per unit
  },
};

local thirdPanel = {
  gridPos+: {
    w: 24 / 3,  // The dashboard width is divided into 24 sections
    h: 10,  // Height is 30 px per unit
  },
};

local quarterPanel = {
  gridPos+: {
    w: 24 / 4,  // The dashboard width is divided into 24 sections
    h: 10,  // Height is 30 px per unit
  },
};


local row1 = {
  gridPos+: {
    y: 0,
  },
};

local httpPanels = [
  httpRequestDurationAverageSeconds + fullPanel + {
    gridPos+: {
      x: 0,
      y: 0,
    },
  },
  httpRequestsPerMinutePanel + fullPanel + {
    gridPos+: {
      x: 0,
      y: 10,
    },
  },
  httpRequestDurationSecondsHeatmap + fullPanel + {
    gridPos+: {
      x: 0,
      y: 20,
    },
  },
  httpRequestsPerMinutePerTypePanel + quarterPanel + {
    gridPos+: {
      x: 0,
      y: 30,
    },
  },
  httpRequestsPerMinutePerStatusPanel + quarterPanel + {
    gridPos+: {
      x: 6,
      y: 30,
    },
  },
  httpRequestsPerMinutePerFeedPanel + quarterPanel + {
    gridPos+: {
      x: 12,
      y: 30,
    },
  },
  httpRequestsPerMinutePerCacheTypePanel + quarterPanel + {
    gridPos+: {
      x: 24,
      y: 30,
    },
  },
];

local usagePanels = [
  cpuUsagePanel + halfPanel + {
    gridPos+: {
      x: 0,
      y: 40,
    },
  },
  heapUsedPanel + halfPanel + {
    gridPos+: {
      x: 12,
      y: 40,
    },
  },
];

local wsPanels = [
  wsActiveSubscriptions + halfPanel + {
    gridPos+: {
      y: 50,
      x: 0,
    },
  },
  wsMessagesPerSecondGraph + halfPanel + {
    gridPos+: {
      x: 12,
      y: 50,
    },
  },
  wsConnectionActiveGraph + thirdPanel + {
    gridPos+: {
      x: 0,
      y: 60,
    },
  },
  wsConnectionErrorsGraph + thirdPanel + {
    gridPos+: {
      x: 8,
      y: 60,
    },
  },
  wsConnectionRetriesGraph + thirdPanel + {
    gridPos+: {
      x: 16,
      y: 60,
    },
  },
];

local cachePanels = [
  redisConnectionsOpen + fullPanel + {
    gridPos+: {
      y: 70,
    },
  },
  cacheFeedValues + fullPanel + {
    gridPos+: {
      y: 70,
    },
  },
  cacheMaxAgeSeconds + halfPanel + {
    gridPos+: {
      x: 0,
      y: 80,
    },
  },
  cacheStalenessSeconds + halfPanel + {
    gridPos+: {
      x: 12,
      y: 80,
    },
  },
  cacheEntrySetsPerSecond + halfPanel + {
    gridPos+: {
      x: 0,
      y: 90,
    },
  },
  cacheEntryGetsPerSecond + halfPanel + {
    gridPos+: {
      x: 12,
      y: 90,
    },
  },
];

local panels = httpPanels + usagePanels + wsPanels + cachePanels;

{
  dashboard: dashboard.new(
    dashboardConfig.title,
    uid=dashboardConfig.uid,
    editable=true,
    schemaVersion=26,
    refresh='5s',
  )
             .addTemplates(templates)
             .addPanels(panels),

  name: prometheusJobName,
}
