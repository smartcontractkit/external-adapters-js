local grafana = import 'grafonnet/grafana.libsonnet';

{
  grafanaDashboards:: {
    empty_dashboard: grafana.dashboard.new('Empty Dashboard'),
  },
}
