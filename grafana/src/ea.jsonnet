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
local totalHttpRequestsPanel = graphPanel.new(
  title='${service}-http-requests-total',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'rate(http_requests_total{job="$job", service=~"$service.*"}[1m])',
    legendFormat='{{app_name}}-{{status_code}}-{{type}}'
  )
);
local httpRequestDurationAverage = graphPanel.new(
  title='http-request-duration-average',
  datasource=cortexDataSource,
).addTarget(
  prometheus.target(
    'rate(http_request_duration_seconds_sum{job="$job",service=~"$service.*"}[5m])/rate(http_request_duration_seconds_count{job="$job",service=~"$service.*"}[5m])',
    legendFormat='{{app_name}}',
  )
);
local httpRequestDurationHeatmap = heatmapPanel.new(
  title='${service}-http-request-duration-heatmap',
  datasource=cortexDataSource,
  dataFormat='tsbuckets',
  color_colorScheme='interpolateInferno',
  maxDataPoints=25,
  yAxis_logBase=2
).addTarget(
  prometheus.target(
    'sum(increase(http_request_duration_seconds_bucket{job="$job",service=~"$service.*"}[$__interval])) by (le)',
    legendFormat='{{le}}',
    format='heatmap',
  )
);
local panelSize1 = {
  gridPos+: {
    w: 24,  // The dashboard width is divided into 24 sections, we want to take up the entire row
    h: 10,  // Height is 30 px per unit
  },
};
local panels = [
  totalHttpRequestsPanel + panelSize1,
  httpRequestDurationAverage + panelSize1,
  httpRequestDurationHeatmap + panelSize1,
];


{
  grafanaDashboards:: {
    [prometheusJobName]:
      dashboard.new(
        dashboardConfig.title,
        uid=dashboardConfig.uid,
        editable=true,
        schemaVersion=26
      )
      .addTemplates(templates)
      .addPanels(panels),
  },
}
