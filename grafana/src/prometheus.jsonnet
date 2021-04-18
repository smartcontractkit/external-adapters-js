local promTemplate(targets) = {
  global: {
    scrape_interval: '15s',
    evaluation_interval: '15s',
  },
  scrape_configs: [
    {
      job_name: 'ea-prometheus',
      static_configs: [
        {
          targets: [ x + ':9080' for x in std.split(targets,',')],
        },
      ],
    },
  ],
};


function(targets)
  std.manifestYamlDoc(promTemplate(targets), true)
