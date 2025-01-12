'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './comparison_chart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HistoryChart({ testName, historyData }) {
  const scrubName = (n) => { return n.replace(/^git2$/, 'libgit2'); };

  const executors = [
    scrubName(historyData.executor.baseline.name),
    scrubName(historyData.executor.cli.name)
  ];
  const dates = [ ];
  const results = [ [ ], [ ] ];

  const testData = historyData.tests[testName];

  if (!testData) {
    throw new Error(`could not find ${testName}`);
  }

  for (const date of Object.keys(testData)) {
    dates.push(date);

    const baseline = testData[date].results[0];
    const challenge = testData[date].results[1];

    results[0].push({
      mean: baseline.mean,
      stddev: baseline.stddev,
    });
    results[1].push({
      mean: challenge.mean,
      stddev: challenge.stddev,
    });
  }

  const data = {
    labels: dates,
    datasets: [
      {
        label: executors[0],
        data: results[0],
        backgroundColor: 'rgba(241, 80, 47, 0.65)',
        borderColor: 'rgba(241, 80, 47, 0.80)',
        borderWidth: 1
      },
      {
        label: executors[1],
        data: results[1],
        backgroundColor: 'rgba(55, 125, 205, 0.65)',
        borderColor: 'rgba(55, 125, 205, 0.80)',
        borderWidth: 1
      }
    ]
  };

  const formatTime = (t, decimals = true, precision = 5) => {
    const units = [ "sec", "ms", "μs", "ns" ];
    let unit = 0;

    while (t < 1 && unit < (units.length - 1)) {
      t *= 1000;
      unit++;
    }

    if (decimals) {
      t = t.toPrecision(precision);
    } else {
      t = t.toString().replace(/\..*/, "");
    }

    if (t === "0") {
      return "0";
    }

    return `${t} ${units[unit]}`;
  };

  return (
    <div className={styles.chart}>
      <Bar
        data={data}
        width={1024}
        height={384}
        options={{
          parsing: {
            xAxisKey: 'mean',
            yAxisKey: 'mean'
          },
          scales: {
            y: {
              ticks: {
                callback: function(val, index) {
                  return formatTime(val, false)
                }
              }
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(item) {
                  return `${item.dataset.label}: ${formatTime(item.raw.mean)} ± ${formatTime(item.raw.stddev)}`;
                }
              }
            }
          },
          maintainAspectRatio: false
        }}
      />
    </div>
  );
}
