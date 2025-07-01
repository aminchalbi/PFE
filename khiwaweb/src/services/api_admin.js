import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admin';

const registerAdmin = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

const loginAdmin = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('API Response:', response.data);

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      return response.data;
    } else {
      throw new Error('Token not received');
    }
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};




const getAllUsers = async (token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}/users`, config);
  return response.data;
};



const createSalonForGerant = async (salonData, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.post(`${API_URL}/create-salon-for-gerant`, salonData, config);
    
    if (response.data && response.data.salon) {
      return response.data.salon; // Retourne le salon créé
    } else {
      throw new Error('Réponse inattendue du serveur');
    }
  } catch (err) {
    console.error('Erreur lors de la création du salon:', err.response ? err.response.data : err);
    throw err;
  }
};

const toggleSalonStatus = async (salonId, token) => {
  try {
    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.post(
      `${API_URL}/toggle-salon-status`,
      { salonId }, // Envoyez seulement l'ID du salon
      config
    );
    
    if (response.data && response.data.salon) {
      return response.data.salon;
    } else {
      throw new Error('Réponse inattendue du serveur');
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut du salon:', err.response ? err.response.data : err);
    throw err;
  }
};

const getSalonHistory = async (token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}/salon-history`, config);
  return response.data;
};

const updateSalon = async (id, salonData, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.put(`${API_URL}/update-salon/${id}`, salonData, config);
  return response.data;
};

const getStatistics = async (token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}/statistics`, config);
  return response.data;
};
const createGerant = async (userData, token) => {
  try {
    const response = await axios.post(`${API_URL}/create-gerant`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
}

const updateGerant = async (userId, userData, token) => {
  try {
    const response = await axios.put(`${API_URL}/update-gerant/${userId}`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};
const deleteGerant = async (userId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-gerant/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};
const toggleGerantStatus = async (userData, token) => {
  try {
    const response = await axios.post(`${API_URL}/toggle-gerant-status`, userData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};
const getSalon = async (id, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };
  const response = await axios.get(`${API_URL}/salon/${id}`, config);
  return response.data;
};


export default {
  registerAdmin,
  loginAdmin,
  createGerant,
  toggleGerantStatus,
  updateGerant,
  deleteGerant,
  getAllUsers,
  createSalonForGerant,
  toggleSalonStatus,
  getSalonHistory,
  updateSalon,
  getStatistics,
  getSalon
};