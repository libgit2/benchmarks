#!/usr/bin/env node

const fs = require('node:fs');

const runsDir = 'public/api/runs';
const platformsDir = 'public/api/platforms';

const results = [ ];
const dates = fs.readdirSync(runsDir);

for (const date of dates) {
  fs.readdirSync(`${runsDir}/${date}`,
    { withFileTypes: true }).forEach((item) => {
        if (item.name.endsWith('.json')) {
          const platform = item.name.replace(/\.json$/, '');
          results.push({
            date: date,
            platform: platform,
            file: `${item.path}/${item.name}`
          });
        }
    }
  );
}

const platforms =
  results.map((item) => item.platform).
          filter((item, idx, array) => array.indexOf(item) === idx);

/* Create historical data for each platform */
for (const platform of platforms)
{
  let historical = { system: { }, executor: { }, tests: [ ] };

  for (const item of results.filter((item) => item.platform === platform)) {
    const data = JSON.parse(fs.readFileSync(item.file));

    historical.system = data.system;
    historical.executor = data.executor;

    data.tests.forEach((test) => {
      const results = [ ];

      test.results.map((result) => {
        results.push({
          command: result.command,
          history: [
            {
              date: item.date,
              mean: result.mean,
              stddev: result.stddev
            }
          ]
        });
      });

      let found = false;
      historical.tests.map((item) => {
        if (item.name === test.name) {
          for (let i in results) {
            item.results[i].command = results[i].command;
            item.results[i].history.push(results[i].history[0]);
          }
          found = true;
        }
      } );

      if (!found) {
        historical.tests.push({
          name: test.name,
          results: results
        });
      }
    });
  }

  fs.mkdirSync(platformsDir, { recursive: true });
  fs.writeFileSync(`${platformsDir}/${platform}.json`, JSON.stringify(historical));
}
