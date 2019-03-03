const lowdensity = [
    { metricName: "clickim.tabMatcher.case", polyvalue: [], nullValue: 0, minutesPerPoint: 120},
    { metricName: "clickim.tabMatcher.caseAll", polyvalue: [], nullValue: 0, minutesPerPoint: 120},
    { metricName: "clickim.step.failureReason", polyvalue: [], nullValue: 0, minutesPerPoint: 720},  
    { metricName: "clickim.step.invisibleReason", polyvalue: [], nullValue: 0, minutesPerPoint: 720},  
    { metricName: 'clickim.step.invisibleRecoveryState', polyvalue: [], minutesPerPoint: 60 },
    { title: 'clickim.executionsSinceInitCount > 90%-ile', metricName: 'clickim.executionsSinceInitCount', polyvalue: ['p99', 'max'] },
    { metricName: "uploader_object_length.ELEMENT_LOCATE_RESULT", polyvalue: ['p50', 'p90', 'p99'] },
    { metricName: "uploader_object_length.FRAME_LOCATE_RESULT", polyvalue: ['p50', 'p90', 'p99'] },
];

const self = [
    { metricName: "lambda_build.metricCenter", polyvalue: [], legend: false },
    { metricName: "lambda_invocation.metricCenter" },
    { metricName: "metricCenter.num_scheduled_datapoints" },
    { metricName: "metricCenter.dups" },
    { metricName: "lambda_build.mm-prod-major-ingestion-store", polyvalue: [], legend: false },
    { metricName: "lambda_error.mm-prod-major-ingestion-store" },    
    { metricName: "lambda_duration.mm-prod-major-ingestion-store", polyvalue: ['p50', 'p90', 'p99'] },
    { metricName: "lambda_invocation.mm-prod-major-ingestion-store" },
    { metricName: "metricCenter.lambda_age" },
    { metricName: "metricCenter.num_records", polyvalue: ['p50', 'p90', 'p99']},
    { metricName: "services.dryrun.size" },
    { metricName: "services.dryrun.events" },
    { metricName: "ingest.inputSize" },
    { metricName: "ingest.inputEvents" }
];

const playground = [
  { metricName: "playground.rate" },
];

const main = [
    { 
      title: 'step playback',
      queries: [
        { metricName: "clickim.step.played", name: "played" },
        { metricName: "clickim.step.started", name: "started" },
    ]},
    { 
      title: 'steps: played/started',
      queries: [
        { metricName: "clickim.step.played", name: "replay ratio", minutesPerPoint: 2,
          per: {metricName: "clickim.step.started", formula: "FRACTION", minutesPerPoint: 2 }}
    ]},
    { 
      title: 'step playback outcome',
      queries: [
        { metricName: "clickim.step.completedFail", name: "failed" },
        { metricName: "clickim.step.completedSuccess", name: "succeeded" }
    ]},
    { 
      title: 'steps: failed/completed',
      queries: [
        { metricName: "clickim.step.completedFail", name: 'failure ratio', minutesPerPoint: 2,
          per: {metricName: "clickim.step.completedSuccess", formula: "PARTS", minutesPerPoint: 2 }},
    ]},
    { metricName: "services.version", polyvalue: [] },
    { metricName: "clickim.remote.version", polyvalue: [] },
    { metricName: 'services.queue.saved' },
    { metricName: "services.queue.completed" },
    { metricName: 'services.queue.failed' },
    { metricName: "services.stuckProcesses" },
    { metricName: "clickim.local.version", polyvalue: [] },
    { metricName: "services.endpoint.invoked./test/.GET" },
    { title: 'services /test/.GET outcome',
      queries: [
        {metricName: 'services.endpoint.outcome.200./test/.GET'},
        {metricName: 'services.endpoint.outcome.400./test/.GET'},
        {metricName: 'services.endpoint.outcome.500./test/.GET'}
      ]
    },
    { metricName: "services.endpoint.duration./test/.GET", polyvalue: ['p50', 'p90', 'p99'] },
    { metricName: "services.endpoint.invoked./test/.POST" },
    { title: 'services /test/.POST outcome',
      queries: [
        {metricName: 'services.endpoint.outcome.200./test/.POST'},
        {metricName: 'services.endpoint.outcome.400./test/.POST'},
        {metricName: 'services.endpoint.outcome.500./test/.POST'}
      ]
    },
    { metricName: "services.endpoint.duration./test/.POST", polyvalue: ['p50', 'p90', 'p99'] },
    { metricName: 'services.sockets.testResult:step:update'},
    { metricName: 'services.sockets.testResult:step:updated'},
    { metricName: 'services.sockets.testResult:update'}, 
    { metricName: 'services.sockets.testResult:updated'}
];



export const specByName = {
    main,
    self,
    lowdensity,
    playground
}

  