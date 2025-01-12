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

function setHierarchy(obj, hierarchy, value) {
    let o = obj;

    for (const h of hierarchy.slice(0, -1)) {
        if (! o[h]) {
            o[h] = { };
        }

        o = o[h];
    }

    o[hierarchy[hierarchy.length - 1]] = value;
}

function limit(arr, count) {
    const all = Object.keys(arr).sort().filter(
      (v, i, arr) => arr.indexOf(v) === i
    ).slice(0 - count);

    return Object.fromEntries(Object.entries(arr).filter(([k, v]) => all.indexOf(k) >= 0));
}

/* Create aggregations */
const platforms = { };
const tests = { };

for (const item of results) {
  const data = JSON.parse(fs.readFileSync(item.file));

  /* Aggregate by platform */
  for (const test of data.tests) {
    setHierarchy(platforms, [ item.platform, 'tests', test.name, item.date ], test);
    platforms[item.platform].executor = data.executor;
  }

  /* Aggregate by test */
  for (const test of data.tests) {
    setHierarchy(tests, [ test.name, item.platform, item.date ], test);
  }
}

/* Update the platforms api */
for (const platform in platforms) {
  for (const test in platforms[platform]['tests']) {
    /* Identify test runs for the last 60 days */
    platforms[platform]['tests'][test] = limit(platforms[platform]['tests'][test], daysToKeep);
  }

  fs.mkdirSync(platformsDir, { recursive: true });
  fs.writeFileSync(`${platformsDir}/${platform}.json`, JSON.stringify(platforms[platform]));
}

/* Update the tests api */
for (const test in tests) {
  fs.rmSync(`${testsDir}/${test}`, { recursive: true, force: true });

  for (const platform in tests[test]) {
    /* Identify test runs for the last 60 days */
    const filtered = limit(tests[test][platform], daysToKeep);

    fs.mkdirSync(`${testsDir}/${test}`, { recursive: true });
    fs.writeFileSync(`${testsDir}/${test}/${platform}.json`, JSON.stringify(filtered));
  }
}
