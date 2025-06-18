"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const data = {
  labels: ["Active", "On Holiday", "Sick Leave", "Other"],
  datasets: [
    {
      data: [1154, 45, 12, 23],
      backgroundColor: ["#4CAF50", "#FFC107", "#F44336", "#9E9E9E"],
      borderColor: ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
      borderWidth: 2,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom",
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || "";
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce(
            (acc, data) => acc + data,
            0
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        },
      },
    },
  },
};

export function StatusChart() {
  return <Pie data={data} options={options} />;
}
