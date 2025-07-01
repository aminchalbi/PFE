import React, { useState, useEffect } from 'react';
import apiService from '../services/api_gerant';

const OffersManagement = ({ salonId }) => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    products: [],
    endDate: ''
  });
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const fetchOffers = async () => {
    try {
      const data = await apiService.getOffers(token);
      setOffers(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiService.getProducts(token);
      setProducts(data);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const offerData = {
        ...formData,
        salon: salonId,
        price: parseFloat(formData.price),
        products: formData.products.map(p => ({
          product: p.id,
          quantity: p.quantity || 1
        }))
      };

      if (selectedOfferId) {
        await apiService.updateOffer(selectedOfferId, offerData, token);
      } else {
        await apiService.createOffer(offerData, token);
      }

      fetchOffers();
      resetForm();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      products: [],
      endDate: ''
    });
    setSelectedOfferId(null);
    setShowForm(false);
  };

  const handleEdit = (offer) => {
    setFormData({
      name: offer.name,
      description: offer.description,
      price: offer.price.toString(),
      products: offer.products.map(p => ({
        id: p.product._id,
        name: p.product.name,
        quantity: p.quantity
      })),
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : ''
    });
    setSelectedOfferId(offer._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await apiService.deleteOffer(id, token);
        fetchOffers();
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  const addProductToOffer = (productId) => {
    const product = products.find(p => p._id === productId);
    if (product && !formData.products.some(p => p.id === productId)) {
      setFormData({
        ...formData,
        products: [...formData.products, { id: productId, name: product.name, quantity: 1 }]
      });
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    setFormData({
      ...formData,
      products: formData.products.map(p => 
        p.id === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
      )
    });
  };

  const removeProductFromOffer = (productId) => {
    setFormData({
      ...formData,
      products: formData.products.filter(p => p.id !== productId)
    });
  };

  return (
    <div className="offers-management">
      <h2>Gestion des Offres</h2>
      
      <button onClick={() => setShowForm(!showForm)} className="btn-add">
        {showForm ? 'Annuler' : 'Créer une nouvelle offre'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="offer-form">
          <div className="form-group">
            <label>Nom de l'offre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Prix de l'offre (DT)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Date de fin (optionnel)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Ajouter des produits</label>
            <select
              onChange={(e) => addProductToOffer(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Sélectionnez un produit</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name} ({product.price} DT)
                </option>
              ))}
            </select>
          </div>

          <div className="selected-products">
            <h4>Produits inclus:</h4>
            {formData.products.length === 0 ? (
              <p>Aucun produit sélectionné</p>
            ) : (
              <ul>
                {formData.products.map(product => (
                  <li key={product.id}>
                    <span>{product.name}</span>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                      className="quantity-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeProductFromOffer(product.id)}
                      className="btn-remove"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn-submit">
            {selectedOfferId ? 'Mettre à jour' : 'Créer'} l'offre
          </button>
        </form>
      )}

      <div className="offers-list">
        <h3>Liste des offres</h3>
        {offers.length === 0 ? (
          <p>Aucune offre disponible</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Prix</th>
                <th>Produits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer._id}>
                  <td>{offer.name}</td>
                  <td>{offer.description}</td>
                  <td>{offer.price} DT</td>
                  <td>
                    <ul>
                      {offer.products.map((p, index) => (
                        <li key={index}>
                          {p.quantity}x {p.product?.name || 'Produit supprimé'}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(offer)}>Modifier</button>
                    <button onClick={() => handleDelete(offer._id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OffersManagement;