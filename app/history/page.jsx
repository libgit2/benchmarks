'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from "react";

import HistoryChart from '../../components/history_chart';
import styles from './page.module.css';

function HistoryResults() {
  const searchParams = useSearchParams();
  let startingTestName = searchParams.get('test');
  let startingPlatform = searchParams.get('platform');

  if (!startingTestName) {
    startingTestName = 'hash-object::text_100kb';
  }

  if (!startingPlatform) {
    startingPlatform = 'macos';
  }

  const [ platform, setPlatform ] = useState(startingPlatform);
  const [ testName, setTestName ] = useState(startingTestName);
  const [ testNames, setTestNames ] = useState();
  const [ historyData, setHistoryData ] = useState();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/platforms/${platform}.json`);

      if (! res.ok) {
        throw new Error(`failed to fetch data: ${res.status}`);
      }

      const historyResults = await res.json();
      const testNames = Object.keys(historyResults.tests).sort();

      setTestNames(testNames);
      setHistoryData({
        platform: platform,
        results: historyResults
      });

      router.push(`?test=${testName}&platform=${platform}`);
    })();
  }, [ platform, testName ]);

  return (
    <main className={styles.main}>
      <h1>libgit2 benchmarks</h1>

      <div className={styles.picker}>
        <div className={styles.testPicker}>
          <label>
            Test:
            {
              testNames ?
                <>
                  <select defaultValue={testName} onChange={e => { setTestName(e.target.value); }}>
                  {
                    testNames.map((x) => <option key={x} value={x}>{x}</option>)
                  } 
                  </select>
                </> :
                <select disabled>
                </select>
            }
          </label>
        </div>

        <div className={styles.platformPicker}>
          <label>
            Platform:

            <select defaultValue={platform} onChange={e => { setPlatform(e.target.value); }}>
              <option value="">All</option>
              <option value="macos">macOS</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.chart}>
        {
          historyData && historyData.results ?
            <HistoryChart testName={testName} historyData={historyData.results}
             onClick={ (date) => {
               router.push(`/test/${testName}?platform=${platform}&date=${date}`);
             }} /> :
            <div />
        }
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense>
      <HistoryResults />
    </Suspense>
  );
}
