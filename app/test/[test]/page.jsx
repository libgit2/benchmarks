'use client';

import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from "react";
import sparkline from "@fnando/sparkline";

import styles from './page.module.css';

function formatTime(time) {
  const units = [ 'sec', 'ms', 'μs', 'ns' ];
  let idx = 0;

  while (time < 1 && units.length > idx) {
    time *= 1000;
    idx++;
  }

  return `${time.toFixed(3)} ${units[idx]}`;
}

function formatCommit(sha) {
  return sha.substr(0, 7) + '…';
}

function RunMean({ runData, testData, executor }) {
  const idx = runData.results.executor.baseline && executor !== 'baseline' ? 1 : 0;
  const result = testData.results[idx];

  return (
    <td className={styles.executionResultsTime}>
      <span className={styles.meanTime}>
        <span className={styles.executionResultsTimeMean}>{formatTime(result.mean)}</span> &plusmn; <span className={styles.executionResultsTimeStddev}>{formatTime(result.stddev)}</span>
      </span>

      <span className={styles.userSystemTime}>
        <span className={styles.executionResultsTimeUser}>{formatTime(result.user)}</span> user / <span className={styles.executionResultsTimeSystem}>{formatTime(result.system)}</span> system
      </span>
    </td>
  );
}

function RunRange({ runData, testData, executor }) {
  const idx = runData.results.executor.baseline && executor !== 'baseline' ? 1 : 0;
  const result = testData.results[idx];

  return (
    <td className={styles.executionResultsRange}>
      <span className={styles.minMaxTime}>
        <span className={styles.executionResultsRangeMin}>{formatTime(result.min)}</span> &#8230; <span className={styles.executionResultsRangeMax}>{formatTime(result.max)}</span>
      </span>

      <span className={styles.runCount}>
        ({result.times.length} runs)
      </span>
    </td>
  );
}

function RunPlot({ runData, testData, executor }) {
  const idx = runData.results.executor.baseline && executor !== 'baseline' ? 1 : 0;
  const result = testData.results[idx];

  return (
    <td className={styles.executionResultsPlot}>
      <Sparkline values={result.times} />
    </td>
  );
}

function RunTable({ testName, runData }) {
  const testData = runData.results.tests.filter(t => t.name === testName)[0];

  return (
    <div>
      <table className={styles.run}>
        <thead className={styles.executionHeader}>
          <tr>
            <th className={styles.executionHeaderFill}></th>

            <th className={`${styles.executionHeaderName} ${styles.executionHeaderCliName}`}>
              { runData.results.executor['cli'].name }
            </th>

            { runData.results.executor.baseline ?
              <th className={`${styles.executionHeaderName} ${styles.executionHeaderBaselineName}`}>
                { runData.results.executor['baseline'].name }
                { name }
              </th> :
              ''
            }
          </tr>

          <tr>
            <th></th>

            <th className={`${styles.executionHeaderVersion} ${styles.executionHeaderCliVersion}`}>
              { runData.results.executor['cli'].version }
              { runData.results.executor['cli'].commit ?
                <span className={styles.executionHeaderCommit}>
                  { formatCommit(runData.results.executor['cli'].commit) }
                </span> :
                ''
              }
            </th>

            { runData.results.executor.baseline ?
              <th className={`${styles.executionHeaderVersion} ${styles.executionHeaderBaselineVersion}`}>
                { runData.results.executor['baseline'].version }
                { runData.results.executor['baseline'].commit ?
                  <span className={styles.executionHeaderCommit}>
                    { formatCommit(runData.results.executor['baseline'].commit) }
                  </span> :
                  ''
                }
              </th> :
              ''
            }
          </tr>
        </thead>
        <tbody className={styles.executionResults}>
          <tr>
            <th className={`${styles.executionResultsHeader} ${styles.executionResultsHeaderTime}`}>Time <span className={styles.executionResultsHeaderExplainer}>(mean &plusmn; &sigma;)</span>:</th>

            <RunMean runData={runData} testData={testData} executor='cli' />
            { runData.results.executor.baseline ?
              <RunMean runData={runData} testData={testData} executor='baseline' /> :
              ''
            }
          </tr>

          <tr>
            <th className={`${styles.executionResultsHeader} ${styles.executionResultsHeaderRange}`} rowSpan={2}>Range <span className={styles.executionResultsHeaderExplainer}>(min &#8230; max)</span>:</th>

            <RunRange runData={runData} testData={testData} executor='cli' />
            { runData.results.executor.baseline ?
              <RunRange runData={runData} testData={testData} executor='baseline' /> :
              ''
            }
          </tr>

          <tr>
            <RunPlot runData={runData} testData={testData} executor='cli' />
            { runData.results.executor.baseline ?
              <RunPlot runData={runData} testData={testData} executor='baseline' /> :
              ''
            }
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RunResults({ params }) {
  const searchParams = useSearchParams();
  let startingPlatform = searchParams.get('platform');
  let startingDate = searchParams.get('date');

  if (!startingPlatform) {
    startingPlatform = 'macos';
  }

  if (!startingDate) {
    startingDate = new Date();
    startingDate.setDate(startingDate.getDate() - 1);
    startingDate = startingDate.toISOString().split('T')[0]
  }

  const [ platform, setPlatform ] = useState(startingPlatform);
  const [ date, setDate ] = useState(startingDate);
  const [ runData, setRunData ] = useState();
  const [ testName, setTestName ] = useState();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const test = decodeURIComponent((await params).test);
      const filename = test.replaceAll(/::/g, '__');

      const runResponse = await fetch(`/api/runs/${date}/${platform}.json`);
      const flamegraphResponse = await fetch(`/api/runs/${date}/${platform}/${filename}.svg`);

      if (! runResponse.ok) {
        throw new Error(`failed to fetch data: ${runResponse.status}`);
      }

      const runResults = await runResponse.json();

      let flamegraph = undefined;

      if (flamegraphResponse.ok) {
        flamegraph = await flamegraphResponse.text();
        flamegraph = flamegraph.replace(/^<\?xml version=\"\d+.\d+\" standalone=\"[^\"]+\"\?>\s*/, '');
        flamegraph = flamegraph.replace(/^<\!DOCTYPE svg PUBLIC \"[^\"]+\" \"[^\"]+\">/, '');

        flamegraph = flamegraph.replace(/<rect [^>]+ fill=\"url\(#background\)\"\s*\/>/, '');
        flamegraph = flamegraph.replace(/<text id=\"title\" [^>]+>Flame Graph<\/text>/, '');
      }
      else if (flamegraphResponse.status != 404) {
        throw new Error(`failed to fetch data: ${runResponse.status}`);
      }

      setTestName(test);
      setRunData({
        platform: platform,
        date: date,
        results: runResults,
        flamegraph: flamegraph
      });

      console.log(runResults);

      router.push(`?platform=${platform}&date=${date}`);
    }

    fetchData();
  }, [ platform, date ]);

  return (
    <main className={styles.main}>
      <h1>{testName}</h1>

      <div className={styles.picker}>
        <div className={styles.platformPicker}>
          <label>
            Platform:

            <select defaultValue={platform} onChange={e => { setPlatform(e.target.value); }}>
              <option value="macos">macOS</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
            </select>
          </label>
        </div>
        <div className={styles.datePicker}>
          <label>
            Date:

            <input type="date" defaultValue={date} onChange={e => { setDate(e.target.value); }} />
          </label>
        </div>
      </div>

      <div className={styles.table}>
        {
          runData && runData.results ?
            <RunTable testName={testName} runData={runData} /> :
            <div />
        }
      </div>

      { runData && runData.flamegraph ?
          <div className={styles.profiling}>
            <h3>Flame Graph</h3>
            <object data={`data:image/svg+xml;utf8,${encodeURIComponent(runData.flamegraph)}`} className={styles.flamegraph} />
          </div> : 
          <div />
       }
    </main>
  );
}

const Sparkline = props => {
  const sparklineRef = useRef(null);
  const [currentDatapoint, setCurrentDatapoint] = useState(props.values[0]);

  const options = {
    onmousemove: (event, datapoint) => {
      if (datapoint.timestamp !== currentDatapoint.timestamp) {
        setCurrentDatapoint(datapoint);
      }
    },
    onmouseout: (event) => {
      setCurrentDatapoint(props.values[0]);
    }
  };

  useEffect(() => {
    const sortedValues = props.values.sort((a,b) => a.timestamp - b.timestamp)

    // initialize sparkline on mount after the element has rendered
    sparkline(sparklineRef.current, sortedValues, options);
  }, []);

  const getText = datapoint => {
    const dateString = new Date(datapoint.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric"
    });
    return `${dateString}: ${datapoint.value}`;
  };

  return (
    <svg
      ref={sparklineRef}
      width="300"
      height="40"
      strokeWidth="3"
      fill="rgba(55, 125, 205, 0.4)" />
  );
};

export default function RunPage({ params }) {
  return (
    <Suspense>
      <RunResults params={params} />
    </Suspense>
  );
}
