import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../style/Dashboard.css';
import apiService from '../services/api_gerant';
import OffersManagement from '../components/OffersManagement';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [salon, setSalon] = useState(null);
  const [isSalonActive, setIsSalonActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [comptoiristes, setComptoiristes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [showComptoiristeForm, setShowComptoiristeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [criticalIngredients, setCriticalIngredients] = useState([]);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [showReviews, setShowReviews] = useState(false);
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    ingredients: [],
    category: ''
  });

  const [categoryData, setCategoryData] = useState({
    name: '',
    description: '',
    image: ''
  });

  const [ingredientData, setIngredientData] = useState({
    name: '',
    quantity: '',
    unit: '',
  });

  const [orderStats, setOrderStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    totalRevenue: 0
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [comptoiristeData, setComptoiristeData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPromoForm, setShowPromoForm] = useState(false);
const [promoData, setPromoData] = useState({
  promoPrice: '',
  promoLabel: '',
  duration: 7
});

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState(null);
  const [selectedComptoiristeId, setSelectedComptoiristeId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const response = await apiService.getSalon(token);
        setSalon(response.salon);
        setIsSalonActive(response.salon.status === 'approved');
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération du salon:', err);
        navigate('/login');
      }
    };
    fetchSalon();
  }, [token, navigate]);

  useEffect(() => {
    if (salon) {
      const fetchData = async () => {
        await fetchProducts();
        await fetchIngredients();
        await fetchOrders();
        await fetchComptoiristes();
        await fetchReviews();
        await fetchCategories();
      };
      fetchData();
    }
  }, [salon, token]);

  useEffect(() => {
    const fetchCriticalIngredients = async () => {
      try {
        const data = await apiService.getCriticalIngredients();
        setCriticalIngredients(data);
        if (data.length > 0) {
          setShowCriticalAlert(true);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des ingrédients critiques:', err);
      }
      fetchCriticalIngredients();
    };
    
    const interval = setInterval(fetchCriticalIngredients, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPromo = async (productId) => {
  try {
    const response = await apiService.addPromoToProduct(
      productId, 
      {
        promoPrice: parseFloat(promoData.promoPrice),
        promoLabel: promoData.promoLabel,
        durationInDays: parseInt(promoData.duration)
      },
      token
    );
    
    // Mettre à jour le produit dans l'état
    setProducts(products.map(p => 
      p._id === productId ? response.data.product : p
    ));
    
    setShowPromoForm(false);
    setPromoData({ promoPrice: '', promoLabel: '', duration: 7 });
    showSuccessMessage('Promotion ajoutée avec succès');
  } catch (err) {
    setError(err.response?.data?.error || 'Erreur lors de l\'ajout de la promotion');
  }
};
const handleRemovePromo = async (productId) => {
  try {
    const response = await apiService.removePromoFromProduct(productId, token);
    
    // Mettre à jour le produit dans l'état
    setProducts(products.map(p => 
      p._id === productId ? response.data.product : p
    ));
    
    showSuccessMessage('Promotion supprimée avec succès');
  } catch (err) {
    setError(err.response?.data?.error || 'Erreur lors de la suppression de la promotion');
  }
};
  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories(token);
      if (Array.isArray(response)) {
        setCategories(response);
      } else {
        console.error('La réponse des catégories n\'est pas un tableau:', response);
        setCategories([]);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des catégories:', err);
      setCategories([]);
    }
  };

  const fetchComptoiristes = async () => {
    try {
      const response = await apiService.getComptoiristes(token);
      
      // Vérification profonde des données
      if (!Array.isArray(response)) {
        throw new Error("Format de réponse invalide");
      }
  
      const verifiedData = response.map(comp => {
        if (!comp.salon || !comp.salon._id) {
          console.warn("Comptoiriste sans salon valide:", comp);
          return { ...comp, salon: { _id: null, name: "Non assigné" } };
        }
        return comp;
      });
  
      setComptoiristes(verifiedData);
    } catch (err) {
      console.error("Erreur critique:", err);
      setError("Impossible de charger les comptoiristes");
    }
  };


  const fetchProducts = async () => {
    try {
      const products = await apiService.getProducts(token);
      setProducts(products);
    } catch (err) {
      console.error('Erreur lors de la récupération des produits:', err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const ingredients = await apiService.getIngredients(token);
      setIngredients(ingredients || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des ingrédients:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await apiService.getOrders(token);
      if (response.success) {
        setOrders(response.orders);
        setOrderStats(calculateOrderStats(response.orders));
      }
    } catch (err) {
      console.error('Erreur getOrders:', err);
    }
  };

const calculateOrderStats = (orders) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);
  monthStart.setHours(0, 0, 0, 0);

  // Filtrer les commandes non annulées et complétées/delivered
  const validOrders = orders.filter(order => 
    !order.isCancelled && ['completed', 'delivered'].includes(order.status)
  );

  // Initialiser les compteurs
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  let totalRevenue = 0;

  validOrders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const orderAmount = order.total || 0;

    // Calcul du revenu total
    totalRevenue += orderAmount;

    // Compter les commandes par période
    if (orderDate >= todayStart) {
      todayCount++;
    }
    if (orderDate >= weekStart) {
      weekCount++;
    }
    if (orderDate >= monthStart) {
      monthCount++;
    }
  });

  return {
    today: todayCount,
    week: weekCount,
    month: monthCount,
    totalRevenue: totalRevenue
  };
};


  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProductReviews(token);
      
      if (response.success) {
        setReviews(response.reviews);
        // Mettez à jour les statistiques si nécessaire
      } else {
        setError(response.error || 'Erreur lors du chargement des avis');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
      console.error('Erreur fetchReviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.addProduct(productData, token);
      setProducts([...products, response.product]);
      setShowProductForm(false);
      showSuccessMessage('Produit créé avec succès');
    } catch (err) {
      setError('Erreur lors de la création du produit');
      console.error(err);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateProduct(selectedProductId, productData, token);
      setProducts(products.map(prod => prod._id === selectedProductId ? response.product : prod));
      setShowProductForm(false);
      showSuccessMessage('Produit mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour du produit');
      console.error(err);
    }
  };



  const handleDeleteProduct = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await apiService.deleteProduct(id, token);
        setProducts(products.filter(prod => prod._id !== id));
        showSuccessMessage('Produit supprimé avec succès');
      } catch (err) {
        setError('Erreur lors de la suppression du produit');
        console.error(err);
      }
    }
  };

  const handleCreateIngredient = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.addIngredient(ingredientData, token);
      setIngredients([...ingredients, response.ingredient]);
      setShowIngredientForm(false);
      showSuccessMessage('Ingrédient créé avec succès');
    } catch (err) {
      setError('Erreur lors de la création de l\'ingrédient');
      console.error(err);
    }
  };

  const handleUpdateIngredient = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateIngredient(selectedIngredientId, ingredientData, token);
      setIngredients(ingredients.map(ing => ing._id === selectedIngredientId ? response.ingredient : ing));
      setShowIngredientForm(false);
      showSuccessMessage('Ingrédient mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'ingrédient');
      console.error(err);
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet ingrédient ?')) {
      try {
        await apiService.deleteIngredient(id, token);
        setIngredients(ingredients.filter(ing => ing._id !== id));
        showSuccessMessage('Ingrédient supprimé avec succès');
      } catch (err) {
        setError('Erreur lors de la suppression de l\'ingrédient');
        console.error(err);
      }
    }
  };

  const handleCreateComptoiriste = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.createComptoiriste(comptoiristeData, token);
      setComptoiristes([...comptoiristes, response.comptoiriste]);
      setShowComptoiristeForm(false);
      showSuccessMessage('Comptoiriste créé avec succès');
    } catch (err) {
      setError('Erreur lors de la création du comptoiriste');
      console.error(err);
    }
  };
  const handleUpdateComptoiriste = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateComptoiriste(selectedComptoiristeId, comptoiristeData, token);
      setComptoiristes(comptoiristes.map(comp => 
        comp._id === selectedComptoiristeId ? response.comptoiriste : comp
      ));
      setShowComptoiristeForm(false);
      showSuccessMessage('Comptoiriste mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour du comptoiriste');
      console.error(err);
    }
  };

  const toggleComptoiristeStatus = async (userId, isActive) => {
    try {
      await apiService.toggleComptoiristeStatus(userId, isActive, token);
      setComptoiristes(comptoiristes.map(comp => 
        comp._id === userId ? { ...comp, isActive } : comp
      ));
      showSuccessMessage(`Comptoiriste ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut du comptoiriste');
      console.error(err);
    }
  };
  const handleDeleteComptoiriste = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce comptoiriste ? Cette action est irréversible.')) {
      try {
        await apiService.deleteComptoiriste(id, token);
        setComptoiristes(comptoiristes.filter(comp => comp._id !== id));
        showSuccessMessage('Comptoiriste supprimé avec succès');
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression du comptoiriste');
        console.error(err);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await apiService.updateOrderStatus(orderId, status, token);
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
      showSuccessMessage('Statut de la commande mis à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut de la commande');
      console.error(err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    try {
      const imageUrl = await apiService.uploadImage(file, token);
      setProductData({ ...productData, image: imageUrl });
      showSuccessMessage('Image téléversée avec succès');
    } catch (err) {
      setError('Erreur lors du téléversement de l\'image');
      console.error(err);
    }
  };

  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    // Mettez à jour l'état immédiatement avec le fichier
    setCategoryData({ 
      ...categoryData, 
      image: file  // Stockez l'objet File directement
    });
  };
  
  // Et dans le formulaire :
  <input 
    type="file" 
    onChange={handleCategoryImageUpload} 
    disabled={!isSalonActive}
  />
  {categoryData.image && (
    categoryData.image instanceof File ? (
      <img src={URL.createObjectURL(categoryData.image)} alt="Prévisualisation" className="category-image" />
    ) : (
      <img src={categoryData.image} alt="Catégorie" className="category-image" />
    )
  )}

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.createCategory(categoryData, token);
      
      // Mise à jour de l'état avec la nouvelle catégorie
      setCategories([...categories, {
        _id: response._id,
        name: response.name,
        description: response.description,
        image: response.image
      }]);
      
      setShowCategoryForm(false);
      setCategoryData({ name: '', description: '', image: '' });
      showSuccessMessage('Catégorie créée avec succès');
    } catch (err) {
      setError('Erreur lors de la création de la catégorie');
      console.error(err);
    }
  };
  

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.updateCategory(selectedCategoryId, categoryData, token);
      
      // Mise à jour de l'état avec la catégorie modifiée
      setCategories(categories.map(cat => 
        cat._id === selectedCategoryId ? {
          ...cat,
          name: response.name,
          description: response.description,
          image: response.image || cat.image // Garde l'ancienne image si aucune nouvelle n'est fournie
        } : cat
      ));
      
      setShowCategoryForm(false);
      showSuccessMessage('Catégorie mise à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour de la catégorie');
      console.error(err);
    }
  };
  const handleDeleteCategory = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await apiService.deleteCategory(id, token);
        setCategories(categories.filter(cat => cat._id !== id));
        showSuccessMessage('Catégorie supprimée avec succès');
      } catch (err) {
        setError('Erreur lors de la suppression de la catégorie');
        console.error(err);
      }
    }
  };

  const statisticsData = {
    labels: ['Produits', 'Ingrédients', 'Commandes', 'Comptoiristes', 'Catégories'],
    datasets: [
      {
        label: 'Statistiques',
        data: [
          products.length,
          ingredients.length,
          orders.length,
          comptoiristes.length,
          categories.length,
        ],
        backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56', '#9966FF'],
      },
    ],
  };

  useEffect(() => {
    if (Array.isArray(ingredients)) {
      ingredients.forEach(ingredient => {
        if (ingredient.quantity < 1 && ingredient.unit === 'kg') {
          alert(`Attention : La quantité de ${ingredient.name} est critique (${ingredient.quantity} ${ingredient.unit})`);
        }
      });
    }
  }, [ingredients]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>Menu</h2>
        <ul>
          <li onClick={() => navigate('/dashboard')}>Tableau de bord</li>
          <li 
            onClick={() => setShowProductForm(!showProductForm)}
            style={!isSalonActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            Créer un produit
          </li>
          <li 
            onClick={() => setShowIngredientForm(!showIngredientForm)}
            style={!isSalonActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            Créer un ingrédient
          </li>
          <li 
            onClick={() => setShowComptoiristeForm(!showComptoiristeForm)}
            style={!isSalonActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            Créer un comptoiriste
          </li>
          <li 
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            style={!isSalonActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}
          >
            Créer une catégorie
          </li>
          <li onClick={fetchOrders}>Commandes du jour</li>
          <li 
    className={criticalIngredients.length > 0 ? 'sidebar-alert-badge' : ''}
    data-count={criticalIngredients.length}
    onClick={() => {
      setShowCriticalAlert(!showCriticalAlert);
      setShowReviews(false);
      // Masquer les autres formulaires si nécessaire
    }}
  >
    Alertes Stock ({criticalIngredients.length})
  </li>
          <li 
            onClick={() => {
              setShowReviews(!showReviews);
              if (!showReviews) {
                fetchReviews();
              }
            }}
            className={showReviews ? 'active' : ''}
          >
            Avis des clients
          </li>
           <li 
      onClick={() => {
        setShowOffers(!showOffers);
        // Masquer les autres sections
        setShowProductForm(false);
        setShowIngredientForm(false);
        setShowComptoiristeForm(false);
        setShowCategoryForm(false);
        setShowReviews(false);
      }}
      style={!isSalonActive ? { opacity: 0.5, pointerEvents: 'none' } : {}}
    >
      Gestion des offres
    </li>
          {showCriticalAlert && criticalIngredients.length > 0 && (
        <div className="critical-ingredients-alert">
          <div className="alert-header">
            <h3>⚠️ Alertes Stock Critique</h3>
            <button 
              onClick={() => setShowCriticalAlert(false)}
              className="close-alert"
            >
              &times;
            </button>
          </div>
          <div className="critical-list">
            {criticalIngredients.map(ingredient => (
              <div key={ingredient._id} className="critical-item">
                <span className="ingredient-name">{ingredient.name}</span>
                <span className="ingredient-stock">
                  {ingredient.quantity} {ingredient.unit} restants
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
        </ul>
        <button onClick={handleLogout} className="logout-button">Déconnexion</button>
      </div>

      <div className="main-content">
        <div className="navbar">
          <h2>Bienvenue à {salon?.name}, Mr le Gérant</h2>
          {!isSalonActive && (
            <div className="salon-status-warning">
              Votre salon est actuellement désactivé. Contactez l'administrateur.
            </div>
          )}
            {showOffers && (
    <div className="offers-section">
      <OffersManagement salonId={salon?._id} />
    </div>
  )}
        </div>

        <div className="content">
          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}

         {/* Formulaire de création/mise à jour de produit */}
{showProductForm && (
  <div className="form-container">
    <h3>{selectedProductId ? 'Modifier un produit' : 'Créer un produit'}</h3>
    <form onSubmit={selectedProductId ? handleUpdateProduct : handleCreateProduct}>
      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          value={productData.name}
          onChange={(e) => setProductData({ ...productData, name: e.target.value })}
          required
          disabled={!isSalonActive}
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={productData.description}
          onChange={(e) => setProductData({ ...productData, description: e.target.value })}
          disabled={!isSalonActive}
        />
      </div>
      <div className="form-group">
        <label>Prix (DT)</label>
        <input
          type="number"
          value={productData.price}
          onChange={(e) => setProductData({ ...productData, price: e.target.value })}
          required
          disabled={!isSalonActive}
        />
      </div>
      <div className="form-group">
        <label>Promotion</label>
        {productData.isOnPromo ? (
          <div className="promo-details">
            <p>Promotion active: {productData.promoDetails.promoLabel}</p>
            <p>Prix promo: {productData.promoDetails.promoPrice} DT</p>
            <p>Valable jusqu'au: {new Date(productData.promoDetails.endDate).toLocaleDateString()}</p>
            <button 
              type="button"
              onClick={() => handleRemovePromo(selectedProductId)}
              className="remove-promo-btn"
              disabled={!isSalonActive}
            >
              Supprimer la promotion
            </button>
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => setShowPromoForm(true)}
            className="add-promo-btn"
            disabled={!isSalonActive}
          >
            Ajouter une promotion
          </button>
        )}
      </div>
      <div className="form-group">
        <label>Image</label>
        <input 
          type="file" 
          onChange={handleImageUpload} 
          disabled={!isSalonActive}
        />
        {productData.image && <img src={productData.image} alt="Produit" className="product-image" />}
      </div>
      <div className="form-group">
        <label>Catégorie</label>
        <select
          value={productData.category}
          onChange={(e) => setProductData({ ...productData, category: e.target.value })}
          disabled={!isSalonActive}
        >
          <option value="">Sélectionnez une catégorie</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Ingrédients</label>
        <select
          multiple
          value={productData.ingredients}
          onChange={(e) =>
            setProductData({
              ...productData,
              ingredients: Array.from(e.target.selectedOptions, (option) => option.value),
            })
          }
          disabled={!isSalonActive}
        >
          {Array.isArray(ingredients) && ingredients.map((ingredient) => (
            <option key={ingredient._id} value={ingredient._id}>
              {ingredient.name} ({ingredient.quantity} {ingredient.unit})
            </option>
          ))}
        </select>
      </div>
      <button 
        type="submit" 
        className="submit-button"
        disabled={!isSalonActive}
      >
        {selectedProductId ? 'Mettre à jour' : 'Créer'}
      </button>
    </form>
  </div>
)}

          {/* Formulaire de création/mise à jour de catégorie */}
          {showCategoryForm && (
            <div className="form-container">
              <h3>{selectedCategoryId ? 'Modifier une catégorie' : 'Créer une catégorie'}</h3>
              <form onSubmit={selectedCategoryId ? handleUpdateCategory : handleCreateCategory}>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={categoryData.name}
                    onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                    required
                    disabled={!isSalonActive}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={categoryData.description}
                    onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                    disabled={!isSalonActive}
                  />
                </div>
                <div className="form-group">
                  <label>Image</label>
                  <input 
                    type="file" 
                    onChange={handleCategoryImageUpload} 
                    disabled={!isSalonActive}
                  />
                  {categoryData.image && <img src={categoryData.image} alt="Catégorie" className="category-image" />}
                </div>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={!isSalonActive}
                >
                  {selectedCategoryId ? 'Mettre à jour' : 'Créer'}
                </button>
              </form>
            </div>
          )}

          {/* Section Statistiques Commandes */}
          <div className="order-stats-container">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{orderStats.today}</div>
              <div className="stat-label">Aujourd'hui</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📆</div>
              <div className="stat-value">{orderStats.week}</div>
              <div className="stat-label">Cette semaine</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value">{orderStats.totalRevenue.toFixed(2)} DT</div>
              <div className="stat-label">Revenu total</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{orderStats.month}</div>
              <div className="stat-label">Ce mois</div>
            </div>
          </div>
{/* Formulaire de promotion */}
{showPromoForm && (
  <div className="modal-overlay">
    <div className="promo-form">
      <h3>Ajouter une promotion</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleAddPromo(selectedProductId);
      }}>
        <div className="form-group">
          <label>Prix promotionnel (DT)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={promoData.promoPrice}
            onChange={(e) => setPromoData({...promoData, promoPrice: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Libellé de la promotion</label>
          <input
            type="text"
            value={promoData.promoLabel}
            onChange={(e) => setPromoData({...promoData, promoLabel: e.target.value})}
            placeholder="Ex: Été 2023, Black Friday..."
            required
          />
        </div>
        <div className="form-group">
          <label>Durée (jours)</label>
          <input
            type="number"
            min="1"
            value={promoData.duration}
            onChange={(e) => setPromoData({...promoData, duration: e.target.value})}
            required
          />
        </div>
        <div className="form-buttons">
          <button type="submit" className="submit-button">Valider</button>
          <button 
            type="button" 
            onClick={() => setShowPromoForm(false)}
            className="cancel-button"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
)}
          {/* Tableau des Commandes */}
          <h3>Commandes récentes</h3>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map(order => (
                  <tr key={order._id} className={`order-row ${order.status}`}>
                    <td>{order.orderNumber || `CMD-${order._id.slice(-6).toUpperCase()}`}</td>
                    <td>{order.client?.name || 'Anonyme'}</td>
                    <td>{new Date(order.createdAt).toLocaleString('fr-FR')}</td>
                    <td>{order.total?.toFixed(2) || '0.00'} DT</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>
                        {order.status === 'pending' ? 'En attente' : 
                         order.status === 'preparing' ? 'En préparation' :
                         order.status === 'ready' ? 'Prête' : 'Livrée'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="view-btn"
                      >
                        Voir
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">En attente</option>
                        <option value="preparing">En préparation</option>
                        <option value="ready">Prête</option>
                        <option value="delivered">Livrée</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Détails Commande */}
          {showOrderDetails && selectedOrder && (
            <div className="modal-overlay">
              <div className="order-details-modal">
                <h3>Détails de la commande #{selectedOrder.orderNumber}</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowOrderDetails(false)}
                >
                  &times;
                </button>
                
                <div className="order-info">
                  <p><strong>Client:</strong> {selectedOrder.client?.name || 'Anonyme'}</p>
                  <p><strong>Téléphone:</strong> {selectedOrder.client?.phone || 'Non fourni'}</p>
                  <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                  <p><strong>Statut:</strong> 
                    <span className={`status-badge ${selectedOrder.status}`}>
                      {selectedOrder.status === 'pending' ? 'En attente' : 
                       selectedOrder.status === 'preparing' ? 'En préparation' :
                       selectedOrder.status === 'ready' ? 'Prête' : 'Livrée'}
                    </span>
                  </p>
                </div>
                
                <div className="order-products">
                  <h4>Produits commandés:</h4>
                  <ul>
                    {selectedOrder.products.map((item, index) => (
                      <li key={index}>
                        <div className="product-item">
                          <span>{item.product?.name || 'Produit inconnu'}</span>
                          <span>{item.quantity} x {item.product?.price?.toFixed(2) || '0.00'} DT</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="order-total">
                  <p><strong>Total:</strong> {selectedOrder.total?.toFixed(2) || '0.00'} DT</p>
                </div>
              </div>
            </div>
          )}

        {/* Section Produits */}
<h3>Produits</h3>
<div className="products-table">
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Description</th>
        <th>Prix (DT)</th>
        <th>Promotion</th>
        <th>Catégorie</th>
        <th>Image</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {products.map((product) => {
        const productCategory = categories.find(cat => cat._id === product.category);
        return (
          <tr key={product._id}>
            <td>{product.name}</td>
            <td>{product.description}</td>
            <td>
              {product.isOnPromo ? (
                <>
                  <span className="original-price">{product.price} DT</span>
                  <span className="promo-price">{product.promoDetails.promoPrice} DT</span>
                </>
              ) : (
                <span>{product.price} DT</span>
              )}
            </td>
            <td>
              {product.isOnPromo ? (
                <div className="promo-badge">
                  <span>{product.promoDetails.promoLabel}</span>
                  <small>Jusqu'au {new Date(product.promoDetails.endDate).toLocaleDateString()}</small>
                  <button 
                    onClick={() => handleRemovePromo(product._id)}
                    className="remove-promo-btn"
                    disabled={!isSalonActive}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setSelectedProductId(product._id);
                    setShowPromoForm(true);
                  }}
                  className="add-promo-btn"
                  disabled={!isSalonActive}
                >
                  + Promo
                </button>
              )}
            </td>
            <td>{productCategory?.name || 'Aucune'}</td>
            <td>
              {product.image && (
                <img src={product.image} alt={product.name} className="product-thumbnail" />
              )}
            </td>
            <td>
              <button
                onClick={() => {
                  setSelectedProductId(product._id);
                  setProductData({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    image: product.image,
                    category: product.category,
                    ingredients: product.ingredients?.map(ing => ing.ingredient._id) || [],
                    isOnPromo: product.isOnPromo,
                    promoDetails: product.promoDetails || null
                  });
                  setShowProductForm(true);
                }}
                className="edit-button"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDeleteProduct(product._id)}
                className="delete-button"
              >
                Supprimer
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

          {/* Section Catégories */}
          <h3>Catégories</h3>
          <div className="card-container">
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>{category.description}</td>
                      <td>
                        {category.image && (
                          <img src={category.image} alt={category.name} className="category-image" />
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedCategoryId(category._id);
                            setCategoryData({
                              name: category.name,
                              description: category.description,
                              image: category.image
                            });
                            setShowCategoryForm(true);
                          }}
                          className="edit-button"
                          disabled={!isSalonActive}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="delete-button"
                          disabled={!isSalonActive}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Ingrédients */}
          <h3>Ingrédients</h3>
          <div className="card-container">
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Quantité</th>
                    <th>Unité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient._id}>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.quantity}</td>
                      <td>{ingredient.unit}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedIngredientId(ingredient._id);
                            setIngredientData({
                              name: ingredient.name,
                              quantity: ingredient.quantity,
                              unit: ingredient.unit,
                            });
                            setShowIngredientForm(true);
                          }}
                          className="edit-button"
                          disabled={!isSalonActive}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ingredient._id)}
                          className="delete-button"
                          disabled={!isSalonActive}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showIngredientForm && (
  <div className="form-container">
    <h3>{selectedIngredientId ? 'Modifier un ingrédient' : 'Créer un ingrédient'}</h3>
    <form onSubmit={selectedIngredientId ? handleUpdateIngredient : handleCreateIngredient}>
      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          value={ingredientData.name}
          onChange={(e) => setIngredientData({ ...ingredientData, name: e.target.value })}
          required
          disabled={!isSalonActive}
        />
      </div>
      <div className="form-group">
        <label>Quantité</label>
        <input
          type="number"
          value={ingredientData.quantity}
          onChange={(e) => setIngredientData({ ...ingredientData, quantity: e.target.value })}
          required
          disabled={!isSalonActive}
        />
      </div>
      <div className="form-group">
        <label>Unité</label>
        <select
          value={ingredientData.unit}
          onChange={(e) => setIngredientData({ ...ingredientData, unit: e.target.value })}
          required
          disabled={!isSalonActive}
        >
          <option value="">Sélectionnez une unité</option>
          <option value="g">Grammes (g)</option>
          <option value="kg">Kilogrammes (kg)</option>
          <option value="L">Litres (L)</option>
          <option value="mL">Millilitres (mL)</option>
          <option value="unité">Unité</option>
        </select>
      </div>
      <button 
        type="submit" 
        className="submit-button"
        disabled={!isSalonActive}
      >
        {selectedIngredientId ? 'Mettre à jour' : 'Créer'}
      </button>
      <button 
        type="button" 
        onClick={() => {
          setShowIngredientForm(false);
          setSelectedIngredientId(null);
          setIngredientData({ name: '', quantity: '', unit: '' });
        }}
        className="cancel-button"
      >
        Annuler
      </button>
    </form>
  </div>
)}

{showComptoiristeForm && (
            <div className="form-container">
              <h3>{selectedComptoiristeId ? 'Modifier un comptoiriste' : 'Créer un comptoiriste'}</h3>
              <form onSubmit={selectedComptoiristeId ? handleUpdateComptoiriste : handleCreateComptoiriste}>
                <div className="form-group">
                  <label>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={comptoiristeData.username}
                    onChange={(e) => setComptoiristeData({ ...comptoiristeData, username: e.target.value })}
                    required
                    disabled={!isSalonActive}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={comptoiristeData.email}
                    onChange={(e) => setComptoiristeData({ ...comptoiristeData, email: e.target.value })}
                    required
                    disabled={!isSalonActive}
                  />
                </div>
                <div className="form-group">
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    value={comptoiristeData.password}
                    onChange={(e) => setComptoiristeData({ ...comptoiristeData, password: e.target.value })}
                    required
                    disabled={!isSalonActive}
                  />
                </div>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={!isSalonActive}
                >
                  {selectedComptoiristeId ? 'Mettre à jour' : 'Créer'}
                </button>
              </form>
            </div>
          )}


          {/* Section Avis des clients */}
          {showReviews && (
  <div className="reviews-section">
    <h3>Avis des clients ({reviews.length})</h3>
    {loading ? (
      <div className="loading">Chargement des avis...</div>
    ) : error ? (
      <div className="error-message">{error}</div>
    ) : reviews.length === 0 ? (
      <div className="no-reviews">Aucun avis trouvé pour vos produits</div>
    ) : (
      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review._id} className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                {review.client?.profile?.image && (
                  <img 
                    src={review.client.profile.image} 
                    alt={review.client.username} 
                  />
                )}
                <span>{review.client?.username || 'Anonyme'}</span>
              </div>
              <div className="review-date">
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            <div className="review-rating">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={i < review.rating ? 'star filled' : 'star'}
                >
                  {i < review.rating ? '★' : '☆'}
                </span>
              ))}
            </div>
            
            {review.product && (
              <div className="review-product">
                <strong>Produit:</strong> {review.product.name}
                {review.product.image && (
                  <img 
                    src={review.product.image} 
                    alt={review.product.name} 
                    className="product-thumbnail"
                  />
                )}
              </div>
            )}
            
            {review.comment && (
              <div className="review-comment">
                <p>"{review.comment}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
          

          {/* Section Comptoiristes */}
          {/* Section Comptoiristes */}
          <h3>Comptoiristes</h3>
          <div className="card-container">
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Nom d'utilisateur</th>
                    <th>Email</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comptoiristes.map((comptoiriste) => (
                    <tr key={comptoiriste._id}>
                      <td>{comptoiriste.username}</td>
                      <td>{comptoiriste.email}</td>
                      <td>
                        <span className={`status ${comptoiriste.isActive ? 'active' : 'inactive'}`}>
                          {comptoiriste.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedComptoiristeId(comptoiriste._id);
                            setComptoiristeData({
                              username: comptoiriste.username,
                              email: comptoiriste.email,
                              password: '',
                            });
                            setShowComptoiristeForm(true);
                          }}
                          className="edit-button"
                          disabled={!isSalonActive}
                        >
                          Modifier
                        </button>
                       
                        <button
  onClick={() => handleDeleteComptoiriste(comptoiriste._id)}
  className="delete-button"
  disabled={!isSalonActive}
  title={!isSalonActive ? "Le salon doit être actif" : "Supprimer ce comptoiriste"}
>
  <i className="fas fa-trash-alt"></i> Supprimer
</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Statistiques */}
          <h3>Statistiques</h3>
          <div className="statistics">
            <Bar data={statisticsData} />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;