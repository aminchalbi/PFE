import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/dashboardadmin.css';
import StatisticsChart from '../components/StatisticsChart';
import MapPicker from '../components/map';
import { toast } from 'react-toastify';
const API_URL = 'http://localhost:3000/api/admin';

const DashboardAdmin = () => {
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [gerantId, setGerantId] = useState('');
  const [salonImages, setSalonImages] = useState([]);
  const [salons, setSalons] = useState([]);
  const [users, setUsers] = useState([]);
  const [location, setLocation] = useState(null);// Coordonnées par défaut (centre de la Tunisie)
  const [statistics, setStatistics] = useState({ totalSalons: 0, activeSalons: 0, totalUsers: 0, activeUsers: 0 });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('gerant');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedSalonImages, setSelectedSalonImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  useEffect(() => {
    fetchSalons();
    fetchUsers();
    fetchStatistics();
  }, []);
    useEffect(() => {
    if (selectedSalon) {
      setAddress(selectedSalon.address);
      if (selectedSalon.location?.coordinates) {
        setLocation([
          selectedSalon.location.coordinates[1],
          selectedSalon.location.coordinates[0]
        ]);
      }
    } else {
      setAddress('');
      setLocation(null);
    }
  }, [selectedSalon]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };
  

  const fetchSalons = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/salon-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalons(response.data.salons);
      updateStatistics(response.data.salons, users);
    } catch (err) {
      console.error('Error fetching salons:', err);
      showMessage('Erreur lors de la récupération des salons', 'error');
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
      updateStatistics(salons, response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      showMessage('Erreur lors de la récupération des utilisateurs', 'error');
    }
  };

  const openImageModal = (images, index = 0) => {
    setSelectedSalonImages(images);
    setCurrentImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedSalonImages(null);
  };

  const navigateImages = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % selectedSalonImages.length 
      : (currentImageIndex - 1 + selectedSalonImages.length) % selectedSalonImages.length;
    setCurrentImageIndex(newIndex);
  };

  const fetchStatistics = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data.statistics);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      showMessage('Erreur lors de la récupération des statistiques', 'error');
    }
  };

  const updateStatistics = (salons, users) => {
    const totalSalons = salons.length;
    const activeSalons = salons.filter((salon) => salon.status === 'approved').length;
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.isActive).length;
    setStatistics({ totalSalons, activeSalons, totalUsers, activeUsers });
  };

  const handleCreateSalon = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', salonName);
    formData.append('address', address); 
    formData.append('gerantId', gerantId);
    salonImages.forEach((image) => formData.append('images', image));
      if (location) {
    formData.append('location', JSON.stringify({
      type: 'Point',
      coordinates: [location[1], location[0]] // [lng, lat]
    }));
  }
  
    try {
      const response = await axios.post(`${API_URL}/create-salon-for-gerant`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showMessage(`Salon "${salonName}" créé avec succès !`);
      fetchSalons();
      setSalonName('');
      setSalonAddress('');
      setGerantId('');
 formData.append('location', JSON.stringify({
  type: 'Point',
  coordinates: [location[1], location[0]] // [longitude, latitude]
}));
      setSalonImages([]);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        if (err.response.data.salonId) {
          showMessage(
            `Ce gérant est déjà associé à un salon. [ID: ${err.response.data.salonId}]`,
            'error'
          );
        } else {
          showMessage(err.response.data.error, 'error');
        }
      } else {
        showMessage('Erreur lors de la création du salon', 'error');
      }
      console.error('Error creating salon:', err);
    }
  };

  const handleUpdateSalon = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('name', salonName);
    formData.append('address', address);
    formData.append('gerantId', gerantId);
    salonImages.forEach((image) => formData.append('images', image));

    try {
      await axios.put(`${API_URL}/update-salon/${selectedSalon._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      showMessage(`Salon "${salonName}" mis à jour avec succès !`);
      fetchSalons();
      setSelectedSalon(null);
      setSalonName('');
      setSalonAddress('');
      setGerantId('');
      setSalonImages([]);
    } catch (err) {
      console.error('Error updating salon:', err);
      showMessage('Erreur lors de la mise à jour du salon', 'error');
    }
  };

  const handleToggleSalonStatus = async (salonId, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/toggle-salon-status`,
        { salonId, isActive: currentStatus === 'pending' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data?.salon) {
        const updatedSalon = response.data.salon;
        showMessage(`Salon ${updatedSalon.status === 'approved' ? 'activé' : 'désactivé'} avec succès`);
        setSalons(prev => prev.map(salon => salon._id === salonId ? updatedSalon : salon));
        updateStatistics(salons.map(salon => salon._id === salonId ? updatedSalon : salon), users);
      }
    } catch (err) {
      console.error('Erreur:', err);
      showMessage('Échec de la mise à jour du statut', 'error');
    }
  };

  const handleCreateGerant = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userData = { username: newUsername, email: newEmail, password: newPassword, role: newRole };

    try {
      await axios.post(`${API_URL}/create-gerant`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      
      showMessage(`Gérant "${newUsername}" créé avec succès !`);
      fetchUsers();
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
    } catch (err) {
      console.error('Error creating gerant:', err);
      showMessage('Erreur lors de la création du gérant', 'error');
    }
  };

  const handleUpdateGerant = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const userData = { username: newUsername, email: newEmail, password: newPassword, role: newRole };

    try {
      await axios.put(`${API_URL}/update-gerant/${selectedUser._id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage(`Gérant "${newUsername}" mis à jour avec succès !`);
      fetchUsers();
      setSelectedUser(null);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
    } catch (err) {
      console.error('Error updating gerant:', err);
      showMessage('Erreur lors de la mise à jour du gérant', 'error');
    }
  };

  const handleDeleteGerant = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      const user = users.find(u => u._id === userToDelete);
      await axios.delete(`${API_URL}/delete-gerant/${userToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage(`Gérant "${user.username}" supprimé avec succès`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting gerant:', err);
      showMessage('Erreur lors de la suppression du gérant', 'error');
    }
    setShowDeleteConfirm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Navbar handleLogout={handleLogout} />
        <div className="content">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
              <span className="close-message" onClick={() => setMessage({ text: '', type: '' })}>×</span>
            </div>
          )}

          {selectedImage && (
            <div className="image-modal" onClick={closeImageModal}>
              <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <span className="close-modal" onClick={closeImageModal}>&times;</span>
                <img src={selectedImage} alt="Agrandissement" />
              </div>
            </div>
          )}
          

          <div className="card" id="salons">
            <h3>{selectedSalon ? 'Modifier Salon' : 'Créer Salon'}</h3>
            <form onSubmit={selectedSalon ? handleUpdateSalon : handleCreateSalon}>
              <input
                type="text"
                placeholder="Nom du Salon"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                required
              />
            
               <input
    type="text"
    placeholder="Adresse du Salon"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    required
  />

  <MapPicker
    position={location}
    onPositionChange={(newPosition) => {
      setLocation(newPosition);
    }}
    onAddressChange={(newAddress) => {
      setAddress(newAddress);
    }}
  />
              <input
                type="file"
                multiple
                onChange={(e) => setSalonImages(Array.from(e.target.files))}
              />
              <select
                value={gerantId}
                onChange={(e) => setGerantId(e.target.value)}
                required
              >
                <option value="">Sélectionner un Gérant</option>
                {users
                  .filter((user) => user.role === 'gerant')
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username} - {user.email}
                    </option>
                  ))}
              </select>
              <button type="submit">{selectedSalon ? 'Mettre à jour' : 'Créer Salon'}</button>
            </form>
          </div>
        

          <div className="card" id="users">
            <h3>{selectedUser ? 'Modifier Gérant' : 'Créer Gérant'}</h3>
            <form onSubmit={selectedUser ? handleUpdateGerant : handleCreateGerant}>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button type="submit">{selectedUser ? 'Mettre à jour' : 'Créer Gérant'}</button>
            </form>
          </div>

          <div className="card" id="salons">
            <h3>Salons</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Gérant</th>
                  <th>Images</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salons.map((salon) => (
                  <tr key={salon._id}>
                    <td>{salon.name}</td>
                    <td>{salon.address}</td>
                    <td>{salon.gerant?.username || 'N/A'}</td>
                    <td>
                      {salon.images?.length > 0 ? (
                        <div className="image-preview-container">
                          <img
                            src={`http://localhost:3000/uploads/${salon.images[0]}`}
                            alt={`Salon ${salon.name}`}
                            className="salon-image"
                            onClick={() => openImageModal(salon.images)}
                          />
                          {salon.images.length > 1 && (
                            <span className="image-count-badge">+{salon.images.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span>Aucune image</span>
                      )}
                      <td>
  {salon.address}
{salon.location?.coordinates && (
  <a 
    href={`https://www.google.com/maps?q=${salon.location.coordinates[1]},${salon.location.coordinates[0]}`}
    target="_blank"
    rel="noopener noreferrer"
    className="map-link"
  >
    (Voir sur la carte)
  </a>
)}
</td>
                    </td>
                    <td>{salon.status}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedSalon(salon);
                          setSalonName(salon.name);
                          setSalonAddress(salon.address);
                          setGerantId(salon.gerant?._id || '');
                        }}
                        className="edit-button"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleSalonStatus(salon._id, salon.status)}
                        className={salon.status === 'approved' ? 'active' : 'inactive'}
                      >
                        {salon.status === 'approved' ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedSalonImages && (
            <div className="image-modal" onClick={closeImageModal}>
              <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <span className="close-modal" onClick={closeImageModal}>&times;</span>
                <img 
                  src={`http://localhost:3000/uploads/${selectedSalonImages[currentImageIndex]}`}
                  alt={`Salon ${currentImageIndex + 1}`}
                />
                {selectedSalonImages.length > 1 && (
                  <>
                    <button 
                      className="nav-button prev" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImages('prev');
                      }}
                    >
                      &#10094;
                    </button>
                    <button 
                      className="nav-button next" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateImages('next');
                      }}
                    >
                      &#10095;
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1} / {selectedSalonImages.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="card" id="users">
            <h3>Gérants</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom d'utilisateur</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => user.role === 'gerant')
                  .map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.isActive ? 'Actif' : 'Inactif'}</td>
                      <td>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewUsername(user.username);
                            setNewEmail(user.email);
                          }}
                          className="edit-button"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteGerant(user._id)}
                          className="delete-button"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {showDeleteConfirm && (
            <div className="confirmation-dialog">
              <div className="confirmation-dialog-content">
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer ce gérant ?</p>
                <div>
                  <button className="cancel" onClick={() => setShowDeleteConfirm(false)}>
                    Annuler
                  </button>
                  <button className="confirm" onClick={confirmDelete}>
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="card" id="statistics">
            <h3>Statistiques</h3>
            <div className="stats">
              <p>Total Salons: {statistics.totalSalons}</p>
              <p>Salons Actifs: {statistics.activeSalons} ({((statistics.activeSalons / statistics.totalSalons) * 100 || 0).toFixed(2)}%)</p>
              <p>Total Utilisateurs: {statistics.totalUsers}</p>
              <p>Utilisateurs Actifs: {statistics.activeUsers} ({((statistics.activeUsers / statistics.totalUsers) * 100 || 0).toFixed(2)}%)</p>
            </div>
            <StatisticsChart statistics={statistics} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;