import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatisticsChart = ({ statistics }) => {
  const data = {
    labels: ['Total Salons', 'Active Salons', 'Total Users', 'Active Users'],
    datasets: [
      {
        data: [statistics.totalSalons, statistics.activeSalons, statistics.totalUsers, statistics.activeUsers],
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'],
        hoverBackgroundColor: ['#2980b9', '#27ae60', '#c0392b', '#e67e22'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="chart-container">
      <Doughnut data={data} options={options} />
    </div>
    
  );
};

export default StatisticsChart;