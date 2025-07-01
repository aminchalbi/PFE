import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart'; // Ajoutez ce package
import 'dart:math'; 
class MapRoutePage extends StatefulWidget {
  final String salonName;
  final String salonAddress;
  final LatLng salonLocation;
  final String? salonPhone;

  const MapRoutePage({
    Key? key,
    required this.salonName,
    required this.salonAddress,
    required this.salonLocation,
    this.salonPhone,
  }) : super(key: key);

  @override
  _MapRoutePageState createState() => _MapRoutePageState();
}

class _MapRoutePageState extends State<MapRoutePage> {
  late GoogleMapController mapController;
  LatLng? _currentPosition;
  bool _isLoading = true;
  String? _error;
  int _retryCount = 0;
  final int _maxRetries = 3;

  Set<Polyline> polylines = {};
  Set<Marker> markers = {};

  @override
  void initState() {
    super.initState();
    _initializeLocation();
  }

  Future<void> _initializeLocation() async {
    try {
      // Vérifier si les services de localisation sont activés
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Proposer d'activer les services
        bool enabled = await _showLocationServiceDialog();
        if (!enabled) {
          setState(() {
            _error = 'Services de localisation désactivés';
            _isLoading = false;
          });
          return;
        }
      }

      // Vérifier les permissions
      PermissionStatus permission = await Permission.location.request();
      if (!permission.isGranted) {
        setState(() {
          _error = 'Permission de localisation refusée';
          _isLoading = false;
        });
        return;
      }

      // Obtenir la position
      await _getCurrentPosition();
    } catch (e) {
      _handleError(e);
    }
  }

  Future<bool> _showLocationServiceDialog() async {
    return await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Localisation requise'),
        content: const Text('Activez les services de localisation pour voir votre position sur la carte'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () async {
              await Geolocator.openLocationSettings();
              Navigator.pop(context, true);
            },
            child: const Text('Activer'),
          ),
        ],
      ),
    ) ?? false;
  }

  Future<void> _getCurrentPosition() async {
    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.best,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
        _updateMap();
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      if (_retryCount < _maxRetries) {
        _retryCount++;
        await Future.delayed(const Duration(seconds: 1));
        await _getCurrentPosition();
      } else {
        _handleError(e);
      }
    }
  }

  void _handleError(dynamic error) {
    setState(() {
      _error = 'Impossible d\'obtenir la position actuelle\n${error.toString()}';
      _isLoading = false;
      
      // Afficher quand même le salon si la position actuelle échoue
      if (_currentPosition == null) {
        _currentPosition = widget.salonLocation;
        _updateMap();
      }
    });
  }

  void _updateMap() {
    markers = {
      if (_currentPosition != null)
        Marker(
          markerId: const MarkerId('current_position'),
          position: _currentPosition!,
          infoWindow: const InfoWindow(title: 'Votre position'),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      Marker(
        markerId: const MarkerId('salon_position'),
        position: widget.salonLocation,
        infoWindow: InfoWindow(title: widget.salonName, snippet: widget.salonAddress),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      ),
    };

    if (_currentPosition != null) {
      polylines = {
        Polyline(
          polylineId: const PolylineId('route'),
          points: [_currentPosition!, widget.salonLocation],
          color: Colors.blue,
          width: 5,
          geodesic: true,
        ),
      };
    }

    _centerMap();
  }

  void _centerMap() {
  if (!mounted || _currentPosition == null || mapController == null) return;

  final bounds = LatLngBounds(
    southwest: LatLng(
      min(_currentPosition!.latitude, widget.salonLocation.latitude),
      min(_currentPosition!.longitude, widget.salonLocation.longitude),
    ),
    northeast: LatLng(
      max(_currentPosition!.latitude, widget.salonLocation.latitude),
      max(_currentPosition!.longitude, widget.salonLocation.longitude),
    ),
  );

  mapController!.animateCamera(
    CameraUpdate.newLatLngBounds(bounds, 100),
  );
}

  Future<void> _retryLocation() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _retryCount = 0;
    });
    await _initializeLocation();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Itinéraire vers ${widget.salonName}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.navigation),
            onPressed: () => _launchGoogleMaps(),
            tooltip: 'Ouvrir dans Google Maps',
          ),
        ],
      ),
      body: _buildMapContent(),
      floatingActionButton: widget.salonPhone != null
          ? FloatingActionButton(
              onPressed: () => _callSalon(),
              child: const Icon(Icons.call),
              backgroundColor: Colors.green,
            )
          : null,
    );
  }

  Widget _buildMapContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_off, size: 50, color: Colors.red),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
              onPressed: _retryLocation,
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => _openAppSettings(),
              child: const Text('Ouvrir les paramètres'),
            ),
          ],
        ),
      );
    }

    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: widget.salonLocation,
        zoom: 14,
      ),
      onMapCreated: (controller) {
        setState(() {
          mapController = controller;
          if (_currentPosition != null) {
            _centerMap();
          }
        });
      },
      markers: markers,
      polylines: polylines,
      myLocationEnabled: true,
      myLocationButtonEnabled: true,
      zoomControlsEnabled: true,
    );
  }

  Future<void> _launchGoogleMaps() async {
    final origin = _currentPosition != null
        ? '${_currentPosition!.latitude},${_currentPosition!.longitude}'
        : '';

    final url = Uri.parse(
      'https://www.google.com/maps/dir/?api=1'
      '&origin=$origin'
      '&destination=${widget.salonLocation.latitude},${widget.salonLocation.longitude}'
      '&travelmode=driving',
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir Google Maps')),
      );
    }
  }

  Future<void> _openAppSettings() async {
    await openAppSettings();
  }

  void _callSalon() {
    if (widget.salonPhone == null) return;
    launchUrl(Uri.parse('tel:${widget.salonPhone}'));
  }
}