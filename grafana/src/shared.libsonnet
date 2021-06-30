local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local template = grafana.template;
local layout = import './layout.libsonnet';


/**
 * Constants
 */
local prometheusJobName = std.extVar('prometheusJobName');
local cortexDataSource = std.extVar('cortexDataSource');
local instanceFilter = 'job="$job",service=~"$service.*"';
local interval = '[$__rate_interval]';


/**
 * Templates
 */

local createTemplates(multiService) =
  local jobTempl = template.custom('job', query=prometheusJobName, current=prometheusJobName, hide=true);
  local serviceTempl = template.new(
    'service',
    datasource=cortexDataSource,
    query='http_request_duration_seconds_bucket',
    multi=multiService,
    sort=1,
    regex='/.*job="' + prometheusJobName + '".*service="(.*)"/',
    current=if multiService then 'All' else null,
    includeAll=multiService,
    refresh='load'
  );
  local feedTempl = template.new(
    'feed',
    datasource=cortexDataSource,
    query='cache_data_get_values{job="$job"}',
    multi=true,
    sort=1,
    current='All',
    regex='/feed_id="(.*?)"/',
    includeAll=true,
    refresh='load'
  );

  [
    jobTempl,
    serviceTempl,
    feedTempl,
  ];

local addSideLegend(graphPanel) =
  local sideLegend = {
    alignAsTable: true,
    rightSide: true,
    current: true,
    values: true,
    sort: 'current',
    sortDesc: true,
  };

  graphPanel {
    legend+: sideLegend,
  };


local createDashboard(templates, grid) =
  local dashboardConfig = {
    title: std.extVar('dashboardTitle'),
    uid: std.extVar('dashboardUid'),
  };
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
  };

{
  helpers: {
    addSideLegend: addSideLegend,
    createDashboard: createDashboard,
  },
  constants: {
    cortexDataSource: cortexDataSource,
    instanceFilter: instanceFilter,
    interval: interval,
  },
  createTemplates: createTemplates,
}
