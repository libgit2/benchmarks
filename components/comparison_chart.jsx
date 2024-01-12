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

export default function ComparisonChart({ comparisonData, onClick }) {
  const labels = [ ];
  const results = [ [ ], [ ] ];

  comparisonData.tests.forEach((test) => {
    labels.push(test.name);
    results[0].push({
      mean: test.results[0].mean,
      stddev: test.results[0].stddev,
      value: 0 - (test.results[0].mean / (test.results[0].mean + test.results[1].mean))
    });
    results[1].push({
      mean: test.results[1].mean,
      stddev: test.results[1].stddev,
      value: test.results[1].mean / (test.results[0].mean + test.results[1].mean)
    });
  });

  const scrubName = (n) => { return n.replace(/^git2$/, 'libgit2'); };

  const data = {
    labels: labels,
    datasets: [
      {
        label: scrubName(comparisonData.executor.baseline.name),
        data: results[0],
        backgroundColor: 'rgba(241, 80, 47, 0.65)',
        borderColor: 'rgba(241, 80, 47, 0.80)',
        borderWidth: 1
      },
      {
        label: scrubName(comparisonData.executor.cli.name),
        data: results[1],
        backgroundColor: 'rgba(55, 125, 205, 0.65)',
        borderColor: 'rgba(55, 125, 205, 0.80)',
        borderWidth: 1
      }
    ]
  };

  const formatTime = (t) => {
    const units = [ "sec", "ms", "μs", "ns" ];
    let unit = 0;

    while (t < 1 && unit < (units.length - 1)) {
      t *= 1000;
      unit++;
    }

    return `${t.toPrecision(5)} ${units[unit]}`;
  };

  return (
    <div className={styles.chart}>
      <Bar
        data={data}
        width={1024}
        height={(25 * comparisonData.tests.length)}
        options={{
          indexAxis: 'y',
          interaction: {
            intersect: false,
            mode: 'y',
          },
          parsing: {
            xAxisKey: 'value',
            yAxisKey: 'value'
          },
          scales: {
            x: {
              ticks: {
                display: false,
                callback: function(val, index) {
                  return `${Math.abs(this.getLabelForValue(val)) * 100}%`
                }
              }
            },
            y: { stacked: true }
          },
          onClick: (e) => {
            const item = e.chart.getElementsAtEventForMode(e,
              'nearest', { intersect: true }, true);

            if (onClick && item.length != 0) {
              onClick(e.chart.data.labels[item[0].index]);
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                title: function(item) {
                  const nameAndDescription = item[0].label.split(',', 2);
                  return nameAndDescription[0];
                },
                afterTitle: function(item) {
                  const nameAndDescription = item[0].label.split(',', 2);
                  return nameAndDescription[1];
                },
                label: function(item) {
                  return `${item.dataset.label}: ${formatTime(item.raw.mean)} ± ${formatTime(item.raw.stddev)}`;
                },
                footer: function(item) {
                  const labelA = item[0].dataset.label;
                  const labelB = item[1].dataset.label;

                  const meanA = item[0].raw.mean;
                  const meanB = item[1].raw.mean;

                  if (meanA > meanB) {
                    const diff = ((meanA / meanB) - 1) * 100;
                    return `${labelB} is ${diff.toPrecision(2)}% faster than ${labelA}.`;
                  } else if (meanB > meanA) {
                    const diff = ((meanB / meanA) - 1) * 100;
                    return `${labelB} is ${diff.toPrecision(2)}% slower than ${labelA}.`;
                  } else {
                    return `${labelA} is the same speed as ${labelB}.`;
                  }
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
