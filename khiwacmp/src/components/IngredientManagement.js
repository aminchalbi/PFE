// components/IngredientManagement.js
import React, { useState, useEffect } from 'react';
import { fetchIngredients, updateMultipleIngredients } from '../services/api_comptoiriste';
import { FaMinus, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import'../style/ingredient.css';
const IngredientManagement = ({ orders }) => {
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (err) {
        setError(err.message);
      }
    };
    loadIngredients();
  }, []);
    const isValidOrderId = (id) => {
    return orders.some(order => order._id === id || order._id.includes(id));
  };


  const handleQuantityChange = (ingredientId, value) => {
    const quantity = parseFloat(value) || 0;
    setSelectedIngredients(prev => {
      const existingIndex = prev.findIndex(item => item.ingredientId === ingredientId);
      
      if (existingIndex >= 0) {
        if (quantity <= 0) {
          // Supprimer si quantité <= 0
          return prev.filter(item => item.ingredientId !== ingredientId);
        }
        // Mettre à jour la quantité
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantityUsed: quantity };
        return updated;
      }
      
      // Ajouter un nouvel ingrédient
      if (quantity > 0) {
        return [...prev, { ingredientId, quantityUsed: quantity }];
      }
      
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      if (!orderId || !isValidOrderId(orderId)) {
        throw new Error('Veuillez entrer un numéro de commande valide');
      }
  
      if (selectedIngredients.length === 0) {
        throw new Error('Veuillez sélectionner au moins un ingrédient');
      }
  
      // Valider les quantités avant envoi
      const invalidIngredients = selectedIngredients.filter(item => {
        const ingredient = ingredients.find(ing => ing._id === item.ingredientId);
        return ingredient && item.quantityUsed > ingredient.quantity;
      });
  
      if (invalidIngredients.length > 0) {
        throw new Error(`Quantité trop élevée pour: ${
          invalidIngredients.map(item => {
            const ing = ingredients.find(i => i._id === item.ingredientId);
            return ing ? ing.name : '';
          }).join(', ')
        }`);
      }
      const response = await updateMultipleIngredients(
        orderId,
        selectedIngredients.map(item => ({
          ingredientId: item.ingredientId,
          quantityUsed: Number(item.quantityUsed)
        }))
      );
    

     

      // Recharger les ingrédients après mise à jour
      const updatedIngredients = await fetchIngredients();
      setIngredients(updatedIngredients);
      
      setSuccess(response.message || 'Stocks mis à jour avec succès');
      setSelectedIngredients([]);
      setOrderId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuantity = (ingredientId) => {
    const selected = selectedIngredients.find(item => item.ingredientId === ingredientId);
    return selected ? selected.quantityUsed : 0;
  };

  return (
    <div className="ingredient-management">
      <h2>Gestion des stocks d'ingrédients</h2>
      
      <form onSubmit={handleSubmit}>
      <div className="form-group">
  <label>Numéro de commande</label>
  <select
    value={orderId}
    onChange={(e) => setOrderId(e.target.value)}
    required
  >
    <option value="">Sélectionnez une commande</option>
    {orders.map(order => (
      <option key={order._id} value={order._id}>
        #{order._id.slice(-6)} - {order.client?.username || 'Client'} - {order.status}
      </option>
    ))}
  </select>
</div>

        <div className="ingredients-list">
          <h3>Ingrédients utilisés</h3>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Stock actuel</th>
                <th>Quantité utilisée</th>
                <th>Unité</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ingredient => {
                const isLowStock = ingredient.quantity <= getLowStockThreshold(ingredient.unit);
                return (
                  <tr key={ingredient._id} className={isLowStock ? 'low-stock' : ''}>
                    <td>
                      {ingredient.name}
                      {isLowStock && <FaExclamationTriangle className="warning-icon" />}
                    </td>
                    <td>{ingredient.quantity.toFixed(2)}</td>
                    <td>
                      <div className="quantity-control">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(
                            ingredient._id, 
                            getCurrentQuantity(ingredient._id) - getQuantityStep(ingredient.unit)
                )}
                          disabled={getCurrentQuantity(ingredient._id) <= 0}
                        >
                          <FaMinus />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step={getQuantityStep(ingredient.unit)}
                          value={getCurrentQuantity(ingredient._id)}
                          onChange={(e) => handleQuantityChange(ingredient._id, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(
                            ingredient._id, 
                            getCurrentQuantity(ingredient._id) + getQuantityStep(ingredient.unit)
                          )}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </td>
                    <td>{ingredient.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
};

// Helper functions
function getLowStockThreshold(unit) {
  const thresholds = {
    'kg': 5,
    'g': 5000,
    'L': 10,
    'mL': 10000,
    'unité': 10
  };
  return thresholds[unit] || 0;
}

function getQuantityStep(unit) {
  const steps = {
    'kg': 0.1,
    'g': 100,
    'L': 0.1,
    'mL': 100,
    'unité': 1
  };
  return steps[unit] || 1;
}

export default IngredientManagement;