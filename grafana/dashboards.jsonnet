local ea = import './generated/ea.json';
{
  grafanaDashboards:: {
    [ea.name]: ea.dashboard,
  },
}
