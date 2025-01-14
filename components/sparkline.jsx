// React-compatible Sparkline wrapper from Danny Perez
// https://betterprogramming.pub/creating-sparkline-graphs-with-react-b6c349c80005

'use client';

import { Suspense, useEffect, useState, useRef } from "react";

import sparkline from "@fnando/sparkline";

export default function Sparkline({ values, ...props }) {
  const sparklineRef = useRef(null);
  const [currentDatapoint, setCurrentDatapoint] = useState(values[0]);

  console.log(props);

  const options = {
    onmousemove: (event, datapoint) => {
      if (datapoint.timestamp !== currentDatapoint.timestamp) {
        setCurrentDatapoint(datapoint);
      }
    },
    onmouseout: (event) => {
      setCurrentDatapoint(values[0]);
    }
  };

  useEffect(() => {
    const sortedValues = values.sort((a,b) => a.timestamp - b.timestamp)

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
      width={props?.width || 500}
      height={props?.height || 100}
      stroke={props?.stroke}
      strokeWidth={props?.strokeWidth || 3}
      fill={props?.fill || "#000000"} />
  );
};
