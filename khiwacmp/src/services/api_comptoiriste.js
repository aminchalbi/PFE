// services/api_comptoiriste.js

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/comptoiriste';
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const loginComptoiriste = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
  
      // Stocker le token et l'utilisateur dans le localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
  
      return response.data; // Retourner les données pour une utilisation dans le composant React
    } catch (error) {
      throw error.response?.data?.error || 'Erreur de connexion';
    }
  };

// Récupérer les détails du salon


// Récupérer toutes les commandes du salon
export const fetchOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response.data.orders;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des commandes';
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors de la mise à jour';
  }
};

export const fetchRecentClients = async () => {
  try {
    const response = await api.get('/clients/recent');
    return response.data.clients;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des clients';
  }
};

export const fetchSalon = async () => {
  try {
    const response = await api.get('/salon');
    return response.data.salon;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement du salon';
  }
};

export const fetchOrdersWithStats = async () => {
  try {
    const response = await api.get('/orders');
    return {
      orders: response.data.orders,
      stats: response.data.stats,
      dailyOrders: response.data.dailyOrders
    };
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des commandes';
  }
};

export const fetchRecentClientsWithOrders = async () => {
  try {
    const response = await api.get('/clients/recent');
    return response.data.clients;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des clients';
  }
};
export const fetchIngredients = async () => {
  try {
    const response = await api.get('/ingredients');
    return response.data.ingredients;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des ingrédients';
  }
};

// Nouvelle fonction pour mettre à jour les stocks
// services/api_comptoiriste.js
export const updateMultipleIngredients = async (orderId, usedIngredients) => {
  try {
    const response = await api.post('/update-stock', { 
      orderId, // Ajouter orderId dans le corps
      usedIngredients 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating ingredients:', error.response?.data || error);
    throw error.response?.data?.error || 'Erreur lors de la mise à jour des stocks';
  }
};
export const fetchOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.order;
  } catch (error) {
    throw error.response?.data?.error || 'Commande non trouvée';
  }
};
// Fonction pour mettre à jour plusieurs ingrédients

// Ajoutez cette méthode pour récupérer les commandes annulées si besoin
export const fetchCancelledOrders = async () => {
  try {
    const response = await api.get('/orders?cancelled=true');
    return response.data.orders;
  } catch (error) {
    throw error.response?.data?.error || 'Erreur lors du chargement des commandes annulées';
  }
};
export default {
  loginComptoiriste,
  fetchOrders,
  updateOrderStatus,
  fetchRecentClients,
  fetchSalon,
  fetchRecentClientsWithOrders,
  fetchOrdersWithStats,
  fetchIngredients,
  fetchOrderDetails,
  
  updateMultipleIngredients
};



