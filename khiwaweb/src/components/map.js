import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuration des icônes
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationMarker = ({ position, onPositionChange, onAddressChange }) => {
  const map = useMapEvents({
    click: async (e) => {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      onPositionChange(newPosition);
      
      // Récupérer l'adresse réelle
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition[0]}&lon=${newPosition[1]}`
        );
        const data = await response.json();
        onAddressChange(data.display_name || 'Adresse non spécifiée');
      } catch (error) {
        console.error("Erreur lors de la récupération de l'adresse:", error);
        onAddressChange('Adresse non spécifiée');
      }
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Localisation du salon</Popup>
    </Marker>
  ) : null;
};

const MapPicker = ({ position, onPositionChange, onAddressChange }) => {
  return (
    <div className="map-picker">
      <MapContainer
        center={position || [34, 9]}
        zoom={8}
        style={{ height: '300px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker 
          position={position} 
          onPositionChange={onPositionChange}
          onAddressChange={onAddressChange}
        />
      </MapContainer>
    </div>
  );
};

export default MapPicker;