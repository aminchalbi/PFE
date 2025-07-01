import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchOrdersWithStats,
  fetchRecentClientsWithOrders,
  updateOrderStatus
} from '../services/api_comptoiriste';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../style/compt.css';
import IngredientManagement from '../components/IngredientManagement';

const ComptoiristeDashboard = () => {
  const [data, setData] = useState({
    orders: [],
    stats: [],
    dailyOrders: [],
    clients: []
  });
  const [loading, setLoading] = useState(true);
  const [showIngredientManagement, setShowIngredientManagement] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
const [cancelledOrders, setCancelledOrders] = useState([]);
  useEffect(() => {
    const loadData = async () => {
  try {
    const [ordersData, clientsData] = await Promise.all([
      fetchOrdersWithStats(),
      fetchRecentClientsWithOrders()
    ]);
    
    setData({
      orders: ordersData.orders,
      stats: ordersData.stats,
      dailyOrders: ordersData.dailyOrders,
      clients: clientsData
    });
  } finally {
    setLoading(false);
  }
};

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setData(prev => ({
        ...prev,
        orders: prev.orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      }));
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA726',
      preparing: '#42A5F5',
      ready: '#66BB6A',
      delivered: '#AB47BC'
    };
    return colors[status] || '#BDBDBD';
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Tableau de Bord Comptoiriste</h1>
        <p className="welcome-message">Bienvenue, {localStorage.getItem('user')?.username || 'Comptoiriste'}</p>
        <button 
          onClick={() => setShowIngredientManagement(!showIngredientManagement)}
          className="ingredient-button"
        >
          {showIngredientManagement ? 'Retour au tableau de bord' : 'Gérer les ingrédients'}
        </button>
        <button onClick={handleLogout} className="logout-button">
          <i className="fas fa-sign-out-alt"></i> Déconnexion
        </button>
        {!showIngredientManagement && (
          <div className="stats-summary">
            {data.stats.map(stat => (
              <div key={stat._id} className="stat-card" style={{ borderColor: getStatusColor(stat._id) }}>
                <span className="stat-count">{stat.count}</span>
                <span className="stat-label">{stat._id}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {showIngredientManagement ? (
          <IngredientManagement  orders={data.orders} />
        ) : (
          <>
            {/* Graphique des commandes */}
            <section className="chart-section">
              <h2>
                <i className="fas fa-chart-line"></i> Commandes des 7 derniers jours
              </h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.dailyOrders}>
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Dernières commandes */}
            <section className="recent-orders">
              <h2>
                <i className="fas fa-list-alt"></i> Dernières Commandes
                <span className="badge">{data.orders.length}</span>
              </h2>
              <div className="orders-grid">
                {data.orders.filter(order => !order.isCancelled).slice(0, 5).map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">#{order._id.slice(-6)}</span>
                      <span className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-client">
                      <i className="fas fa-user"></i>
                      {order.client?.username || 'Client'}
                      <span className="table-number">
                        <i className="fas fa-table"></i> Table {order.tableNumber}
                      </span>
                    </div>
                    <div className="order-products">
                      {order.products.slice(0, 2).map((item, index) => (
                        <div key={index} className="product-item">
                          <span>{item.quantity}x {item.product?.name}</span>
                          <span>{item.product?.price * item.quantity} Dt</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-actions">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        <option value="pending">En attente</option>
                        <option value="preparing">En préparation</option>
                        <option value="ready">Prêt</option>
                        <option value="delivered">Livré</option>
                      </select>
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="details-btn"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Clients récents */}
            <section className="recent-clients">
              <h2>
                <i className="fas fa-users"></i> Clients Récents
              </h2>
              <div className="clients-list">
                {data.clients.map(client => (
                  <div key={client._id} className="client-card">
                    <div className="client-avatar">
                      {client.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-info">
                      <h4>{client.username}</h4>
                      <p>
                        <i className="fas fa-phone"></i> {client.phone}
                      </p>
                      <div className="client-stats">
                        <span className="order-count">
                          <i className="fas fa-shopping-bag"></i> {client.orderCount} commandes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Notification Bell */}
      <div className="notification-bell">
        <i className="fas fa-bell"></i>
        <span className="notification-count">
          {data.stats.find(s => s._id === 'pending')?.count || 0}
        </span>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="order-detail-table">
              <i className="fas fa-table"></i>
              <span>Table: {selectedOrder.tableNumber}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComptoiristeDashboard;
