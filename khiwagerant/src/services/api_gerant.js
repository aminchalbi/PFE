import axios from 'axios';

const API_URL = 'http://localhost:3000/api/gerant';

// Connexion d'un gérant
const loginGerant = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('role', 'gerant');
    return response.data;
  } catch (err) {
    console.error('Erreur lors de la connexion:', err.response?.data);
    throw err.response?.data?.error || 'Email ou mot de passe incorrect';
  }
};

// Récupérer le salon du gérant
const getSalon = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/salon`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Stocker l'état d'activation dans localStorage
    if (response.data.isActive) {
      localStorage.setItem('salonActive', 'true');
    } else {
      localStorage.removeItem('salonActive');
    }
    
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Récupérer tous les produits
const getProducts = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Ajouter un produit
const addProduct = async (productData, token) => {
  try {
    const response = await axios.post(`${API_URL}/add-product`, productData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Mettre à jour un produit
const updateProduct = async (productId, productData, token) => {
  console.log('Données envoyées:', { productId, productData });
  try {
    const response = await axios.put(`${API_URL}/update-product/${productId}`, productData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Réponse de l\'API:', response.data); // Ajoutez ce log
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Supprimer un produit
const deleteProduct = async (productId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Récupérer tous les ingrédients
const getIngredients = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/ingredients`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.ingredients;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Ajouter un ingrédient
const addIngredient = async (ingredientData, token) => {
  try {
    const response = await axios.post(`${API_URL}/add-ingredient`, ingredientData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Mettre à jour un ingrédient
const updateIngredient = async (ingredientId, ingredientData, token) => {
  try {
    const response = await axios.put(`${API_URL}/update-ingredient/${ingredientId}`, ingredientData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Supprimer un ingrédient
const deleteIngredient = async (ingredientId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-ingredient/${ingredientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Récupérer toutes les commandes
const getOrders = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const validOrders = response.data.orders.filter(order => !order.isCancelled);
    return {
      success: true,
      orders: response.data.orders.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt).toLocaleString('fr-FR'),
        orderNumber: order.orderNumber || `CMD-${order._id.slice(-6).toUpperCase()}`
      }))
    };
  } catch (err) {
    console.error('Erreur getOrders:', err.response?.data || err);
    return {
      success: false,
      error: err.response?.data?.error || 'Erreur lors de la récupération des commandes'
    };
  }
};

// Mettre à jour le statut d'une commande
const updateOrderStatus = async (orderId, status, token) => {
  try {
    const response = await axios.post(`${API_URL}/update-order-status`, { orderId, status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Récupérer les statistiques
const getStatistics = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Récupérer tous les comptoiristes
const getComptoiristes = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/comptoiristes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Créer un comptoiriste
const createComptoiriste = async (comptoiristeData, token) => {
  try {
    // Vérification des champs avant envoi
    if (!comptoiristeData.username || !comptoiristeData.email || !comptoiristeData.password) {
      throw new Error('Tous les champs sont requis');
    }

    const response = await axios.post(
      `${API_URL}/create-comptoiriste`,
      {
        username: comptoiristeData.username,
        email: comptoiristeData.email,
        password: comptoiristeData.password
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.error || 
                    err.response?.data?.message || 
                    err.message || 
                    'Erreur lors de la création';
    throw new Error(errorMsg);
  }
};
// Mettre à jour un comptoiriste
const updateComptoiriste = async (id, comptoiristeData, token) => {
  try {
    const response = await axios.put(`${API_URL}/update-comptoiriste/${id}`, comptoiristeData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Activer/désactiver un comptoiriste
const toggleComptoiristeStatus = async (userId, isActive, token) => {
  try {
    const response = await axios.post(`${API_URL}/toggle-Comptoiriste-Status`, { userId, isActive }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};

// Téléverser une image
const uploadImage = async (file, token) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(`${API_URL}/upload-image`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.imageUrl;
  } catch (err) {
    console.error('Erreur lors du téléversement de l\'image:', err.response?.data);
    throw err.response?.data?.error || 'Erreur lors du téléversement de l\'image';
  }
};



// Récupérer les avis des produits du salon
const getProductReviews = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/product-reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Validation des données reçues
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Format de réponse invalide');
    }

    return {
      success: true,
      averageRating: response.data.averageRating,
      reviews: response.data.reviews || [],
      count: response.data.count || 0
    };
  } catch (err) {
    console.error('API Error getProductReviews:', err.response?.data || err);
    return {
      success: false,
      error: err.response?.data?.error || 'Erreur lors de la récupération des avis',
      reviews: []
    };
  }
};
export const getCriticalIngredients = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/getCriticalIngredients`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.criticalIngredients;
  } catch (error) {
    console.error('Error fetching critical ingredients:', error.response?.data || error);
    throw error.response?.data?.error || 'Erreur lors de la récupération des ingrédients critiques';
  }
};
// Récupérer les statistiques des avis du salon
const getSalonReviews = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/salon-reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err);
    throw err;
  }
};


// Créer une catégorie
const createCategory = async (categoryData, token) => {
  const formData = new FormData();
  formData.append('name', categoryData.name);
  formData.append('description', categoryData.description || '');
  
  if (categoryData.image && categoryData.image instanceof File) {
    formData.append('image', categoryData.image);
  }

  try {
    const response = await axios.post(`${API_URL}/categories`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    console.error('API Error createCategory:', err.response?.data || err);
    throw err.response?.data?.error || 'Erreur lors de la création de la catégorie';
  }
};
// Récupérer toutes les catégories
const getCategories = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error getCategories:', err.response?.data || err);
    throw err.response?.data?.error || 'Erreur lors de la récupération des catégories';
  }
};

// Mettre à jour une catégorie
const updateCategory = async (categoryId, categoryData, token) => {
  const formData = new FormData();
  formData.append('name', categoryData.name);
  formData.append('description', categoryData.description || '');
  
  if (categoryData.image) {
    // Ne pas envoyer l'image si c'est déjà une URL (string)
    if (categoryData.image instanceof File) {
      formData.append('image', categoryData.image);
    }
  }

  try {
    const response = await axios.put(`${API_URL}/categories/${categoryId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    console.error('API Error updateCategory:', err.response?.data || err);
    throw err.response?.data?.error || 'Erreur lors de la mise à jour de la catégorie';
  }
};
// Supprimer une catégorie
const deleteCategory = async (categoryId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error deleteCategory:', err.response?.data || err);
    throw err.response?.data?.error || 'Erreur lors de la suppression de la catégorie';
  }
};
const deleteComptoiriste = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-comptoiriste/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    console.error('API Error deleteComptoiriste:', err.response?.data || err);
    throw err.response?.data?.error || 'Erreur lors de la suppression du comptoiriste';
  }
};
const addPromoToProduct = (productId, promoData, token) => {
  return axios.post(`${API_URL}/products/${productId}/promo`, promoData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

const removePromoFromProduct = (productId, token) => {
  return axios.delete(`${API_URL}/products/${productId}/promo`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

const getPromoProducts = (token) => {
  return axios.get(`${API_URL}/products/promo`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
// services/api_gerant.js

// Créer une offre
const createOffer = async (offerData, token) => {
  try {
    const response = await axios.post(`${API_URL}/offers`, offerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    throw err.response?.data?.error || 'Erreur lors de la création de l\'offre';
  }
};

// Récupérer les offres
const getOffers = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/offers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.offers;
  } catch (err) {
    throw err.response?.data?.error || 'Erreur lors de la récupération des offres';
  }
};

// Mettre à jour une offre
const updateOffer = async (offerId, offerData, token) => {
  try {
    const response = await axios.put(`${API_URL}/offers/${offerId}`, offerData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    throw err.response?.data?.error || 'Erreur lors de la mise à jour de l\'offre';
  }
};

// Supprimer une offre
const deleteOffer = async (offerId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/offers/${offerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    throw err.response?.data?.error || 'Erreur lors de la suppression de l\'offre';
  }
};

// Ajoutez ces méthodes à l'export

  // ... autres méthodes
 

export default {
  loginGerant,
  deleteComptoiriste,
  getSalonReviews,
  getProductReviews ,

  getCriticalIngredients,
 addPromoToProduct,
  removePromoFromProduct,
  getPromoProducts,
  getSalon,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  getOrders,
  updateOrderStatus,
  getStatistics,
  getComptoiristes,
  createComptoiriste,
  updateComptoiriste,
  toggleComptoiristeStatus,
  uploadImage,

  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createOffer,
  getOffers,
  updateOffer,
  deleteOffer

};