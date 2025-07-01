import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import apiService from '../services/api_gerant';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticsPage = ({ token, salonId }) => {
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalIngredients: 0,
    totalOrders: 0,
  });
  const [error, setError] = useState('');

  // Récupérer les statistiques
  const fetchStatistics = async () => {
    try {
      const response = await apiService.getStatistics(token, salonId);
      setStatistics(response);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError('Erreur lors de la récupération des statistiques');
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [token, salonId]);

  // Données pour le graphique
  const statisticsData = {
    labels: ['Produits', 'Ingrédients', 'Commandes'],
    datasets: [
      {
        label: 'Statistiques',
        data: [statistics.totalProducts, statistics.totalIngredients, statistics.totalOrders],
        backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
      },
    ],
  };

  return (
    <div className="statistics-page">
      <h2>Statistiques</h2>
      {error && <div className="error-message">{error}</div>}

      {/* Graphique des statistiques */}
      <div className="statistics-chart">
        <Bar data={statisticsData} />
      </div>
    </div>
  );
};

export default StatisticsPage;