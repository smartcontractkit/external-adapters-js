local promTemplate(targets) = {
  global: {
    scrape_interval: '15s',
    evaluation_interval: '15s',
  },
  scrape_configs: [
    {
      job_name: 'adapters',
      static_configs: [
        {
          targets: [x + ':9080' for x in std.split(targets, ',')],
          labels: {
            namespace: 'adapters',
          },
        },
      ],
    },
  ],
};


function(targets)
  std.manifestYamlDoc(promTemplate(targets), true)
