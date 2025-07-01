import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

class SalonMapPage extends StatefulWidget {
  final LatLng salonLocation;
  final String salonName;

  const SalonMapPage({
    Key? key,
    required this.salonLocation,
    required this.salonName,
  }) : super(key: key);

  @override
  _SalonMapPageState createState() => _SalonMapPageState();
}

class _SalonMapPageState extends State<SalonMapPage> {
  late GoogleMapController mapController;
  LatLng? _currentPosition;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Activez la localisation')),
      );
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Permission refusée')),
        );
        return;
      }
    }

    Position position = await Geolocator.getCurrentPosition();
    setState(() {
      _currentPosition = LatLng(position.latitude, position.longitude);
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Itinéraire vers ${widget.salonName}')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : GoogleMap(
              initialCameraPosition: CameraPosition(
                target: widget.salonLocation,
                zoom: 15,
              ),
              markers: {
                Marker(
                  markerId: MarkerId('salon'),
                  position: widget.salonLocation,
                  infoWindow: InfoWindow(title: widget.salonName),
                ),
                if (_currentPosition != null)
                  Marker(
                    markerId: MarkerId('current'),
                    position: _currentPosition!,
                    infoWindow: InfoWindow(title: 'Votre position'),
                    icon: BitmapDescriptor.defaultMarkerWithHue(
                        BitmapDescriptor.hueBlue),
                  ),
              },
              polylines: {
                if (_currentPosition != null)
                  Polyline(
                    polylineId: PolylineId('route'),
                    points: [_currentPosition!, widget.salonLocation],
                    color: Colors.blue,
                    width: 4,
                  ),
              },
              onMapCreated: (controller) {
                setState(() {
                  mapController = controller;
                });
              },
            ),
    );
  }
}