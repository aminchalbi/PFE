import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './Menu.css'; // Fichier CSS pour le style

const Menu = () => {
  const { salonId } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Récupérer les produits du salon
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/salons/${salonId}/products`);
        setProducts(response.data.products);

        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(response.data.products.map((product) => product.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de la récupération du menu');
        setLoading(false);
      }
    };
    fetchProducts();
  }, [salonId]);

  // Filtrer les produits par catégorie et recherche
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div>Chargement du menu...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="menu-container">
      <h1>Menu du Salon</h1>

      {/* Barre de recherche */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filtres par catégorie */}
      <div className="category-filters">
        <button
          className={!selectedCategory ? 'active' : ''}
          onClick={() => setSelectedCategory('')}
        >
          Tous
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Liste des produits */}
      <div className="product-list">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <img src={product.image} alt={product.name} className="product-image" />
            <div className="product-details">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p className="product-price">{product.price}€</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;