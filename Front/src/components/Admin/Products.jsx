import React from "react";
import { TEChart } from "tw-elements-react";

export default function ChartBarCustomTootlip() {
  return (
    <TEChart
      type="bar"
      data={{
        labels: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
        ],
        datasets: [
          {
            label: "Traffic",
            data: [30, 15, 62, 65, 61, 65, 40],
          },
        ],
      }}
      options={{
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                label = `${label}: ${context.formattedValue} users`;
                return label;
              },
            },
          },
        },
      }}
      darkOptions={{
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                label = `${label}: ${context.formattedValue} users`;
                return label;
              },
            },
          },
          legend: {
            labels: { color: "#fff" },
          },
        },
      }}
    />
  );
}