#!/usr/bin/env node

const fs = require('node:fs');

const runsDir = 'public/api/runs';
const testsDir = 'public/api/tests';
const platformsDir = 'public/api/platforms';

const daysToKeep = 60;

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

/* Create aggregations */
const platforms = { };
const tests = { };

for (const item of results) {
  const data = JSON.parse(fs.readFileSync(item.file));

  /* Aggregate by platform */
  for (const test of data.tests) {
    if (! platforms[item.platform]) {
      platforms[item.platform] = {
        'executor': data.executor,
        'tests': { }
      };
    }

    if (! platforms[item.platform]['tests'][test.name]) {
      platforms[item.platform]['tests'][test.name] = { };
    }

    platforms[item.platform]['tests'][test.name][item.date] = test;
  }

  /* Aggregate by test */
  for (const test of data.tests) {
    if (! tests[test.name]) {
      tests[test.name] = { };
    }

    if (! tests[test.name][item.platform]) {
      tests[test.name][item.platform] = { };
    }

    tests[test.name][item.platform][item.date] = test;
  }
}

/* Update the platforms api */
for (const platform in platforms) {
  for (const test in platforms[platform]['tests']) {
    /* Identify test runs for the last 60 days */
    const dates = Object.keys(platforms[platform]['tests'][test]).sort().filter(
      (v, i, arr) => arr.indexOf(v) === i
    ).slice(0 - daysToKeep);

    /* Filter to the 60 days identified above */
    const filtered = Object.fromEntries(Object.entries(platforms[platform]['tests'][test]).filter(([k, v]) => dates.indexOf(k) >= 0));

    platforms[platform]['tests'][test] = filtered;
  }

  fs.mkdirSync(platformsDir, { recursive: true });
  fs.writeFileSync(`${platformsDir}/${platform}.json`, JSON.stringify(platforms[platform]));
}

/* Update the tests api */
for (const test in tests) {
  fs.rmSync(`${testsDir}/${test}`, { recursive: true, force: true });

  for (const platform in tests[test]) {
    /* Identify test runs for the last 60 days */
    const dates = Object.keys(tests[test][platform]).sort().filter(
      (v, i, arr) => arr.indexOf(v) === i
    ).slice(0 - daysToKeep);

    /* Filter to the 60 days identified above */
    const filtered = Object.fromEntries(Object.entries(tests[test][platform]).filter(([k, v]) => dates.indexOf(k) >= 0));

    fs.mkdirSync(`${testsDir}/${test}`, { recursive: true });
    fs.writeFileSync(`${testsDir}/${test}/${platform}.json`, JSON.stringify(filtered));
  }
}
