'use client';

import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";

import ComparisonChart from '../components/comparison_chart';
import styles from './page.module.css';

export default function ComparisonPage() {
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
  const [ comparisonData, setComparisonData ] = useState();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/runs/${date}/${platform}.json`);

      if (! res.ok) {
        throw new Error(`failed to fetch data: ${res.status}`);
      }

      const comparisonResults = await res.json();

      setComparisonData({
        platform: platform,
        date: date,
        results: comparisonResults
      });

      router.push(`?platform=${platform}&date=${date}`);
    }

    fetchData();
  }, [ platform, date ]);

  return (
    <main className={styles.main}>
      <h1>libgit2 benchmarks</h1>

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

      <div className={styles.chart}>
        {
          comparisonData && comparisonData.results ?
            <ComparisonChart comparisonData={comparisonData.results}
              onClick={ (test) => {
                router.push(`/history?test=${test}&platform=${platform}`);
              }}
              /> :
            <div />
        }
      </div>
    </main>
  );
}
