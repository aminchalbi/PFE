import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../pages/SalonCategoriesPage.dart';
import 'SalonGalleryPage.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import'../pages/map.dart';
class SearchSalonPage extends StatefulWidget {
  const SearchSalonPage({super.key});

  @override
  _SearchSalonPageState createState() => _SearchSalonPageState();
}

class _SearchSalonPageState extends State<SearchSalonPage> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> salons = [];
  bool isLoading = false;
  String? searchError;

  @override
  void initState() {
    super.initState();
    _loadSalons();
  }

  Future<void> _loadSalons() async {
    setState(() {
      isLoading = true;
      searchError = null;
    });

    try {
      final response = await ApiService.getSalons();
      setState(() {
        salons = response;
        if (salons.isEmpty) {
          searchError = 'Aucun salon disponible actuellement\n\n'
                       '👋 Revenez plus tard ou contactez-nous pour plus d\'informations';
        }
      });
    } catch (e) {
      setState(() {
        searchError = 'Erreur lors du chargement: ${e.toString()}';
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sélectionnez votre salon', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
        backgroundColor: const Color.fromARGB(255, 205, 217, 236),
        elevation: 0,
         automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Rechercher par nom, adresse',
                hintStyle: TextStyle(color: Colors.blueGrey[400]),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search, color: Colors.blueAccent),
                  onPressed: () async => await _searchSalons(_searchController.text.trim()),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 20.0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: const BorderSide(color: Colors.blueAccent),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: const BorderSide(color: Colors.blueAccent, width: 2),
                ),
              ),
            ),
            if (searchError != null)
              _buildErrorWidget(),
        Expanded(
  child: isLoading
      ? const Center(child: CircularProgressIndicator())
      : salons.isNotEmpty
          ? ListView.builder(
              itemCount: salons.length,
              itemBuilder: (context, index) => _buildSalonCard(salons[index]),
            )
          : _buildNoSalonWidget(),
),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20),
      child: Card(
        color: Colors.blue[50],
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(15),
          side: BorderSide(color: Colors.blue[200]!, width: 1),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              const Icon(Icons.search_off, size: 40, color: Colors.blueAccent),
              const SizedBox(height: 10),
              Text(
                searchError!,
                style: const TextStyle(color: Colors.blueGrey, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                ),
                onPressed: _loadSalons,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNoSalonWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.storefront, size: 50, color: Colors.blueGrey),
          const SizedBox(height: 20),
          Text(
            'Aucun salon disponible',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 10),
          Text(
            'Revenez plus tard ou élargissez votre recherche',
            style: TextStyle(color: Colors.grey[500], fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

Widget _buildSalonCard(dynamic salon) {
  final images = (salon['images'] as List?)?.cast<String>() ?? [];
  final mainImageUrl = images.isNotEmpty 
      ? 'http://192.168.108.153:3000/uploads/${images[0]}'
      : null;
  final averageRating = (salon['averageRating'] as num?)?.toDouble() ?? 0.0;
  final reviewCount = salon['reviewCount'] ?? 0;

  return Card(
    elevation: 4,
    margin: const EdgeInsets.symmetric(vertical: 10),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
    child: InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SalonCategoriesPage(
            salonId: salon['_id']?.toString() ?? '',
            salonName: salon['name']?.toString() ?? 'Salon',
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                  child: mainImageUrl != null
                      ? Image.network(
                          mainImageUrl,
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          headers: const {"Accept": "image/*"},
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return SizedBox(
                              height: 180,
                              child: Center(
                                child: CircularProgressIndicator(
                                  value: loadingProgress.expectedTotalBytes != null
                                      ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                      : null,
                                ),
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) => Container(
                            height: 180,
                            color: Colors.grey[200],
                            child: const Center(child: Icon(Icons.store, size: 50, color: Colors.blueGrey)),
                          ),
                        )
                      : Container(
                          height: 180,
                          color: Colors.grey[200],
                          child: const Center(child: Icon(Icons.store, size: 50, color: Colors.blueGrey)),
                        ),
                ),
                if (images.isNotEmpty)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: InkWell(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => SalonGalleryPage(
                            salonName: salon['name']?.toString() ?? 'Salon',
                            images: images.map((img) => 'http://192.168.108.153:3000/uploads/$img').toList(),
                          ),
                        ),
                      ),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.photo_library, size: 18, color: Colors.white),
                            SizedBox(width: 4),
                            Text('Galerie', style: TextStyle(color: Colors.white)),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  salon['name']?.toString() ?? 'Nom inconnu',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildRatingStars(averageRating),
                    const SizedBox(width: 8),
                    Text(
                      '(${averageRating.toStringAsFixed(1)})',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$reviewCount avis',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
               Row(
  children: [
    const Icon(Icons.location_on, size: 16, color: Colors.blueAccent),
    const SizedBox(width: 4),
    Expanded(
      child: InkWell(
        onTap: () {
          if (salon['location'] != null && salon['location']['coordinates'] != null) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => MapRoutePage(
                  salonName: salon['name'] ?? 'Salon',
                  salonAddress: salon['address'] ?? '',
                  salonLocation: LatLng(
                    salon['location']['coordinates'][1], // latitude
                    salon['location']['coordinates'][0], // longitude
                  ),
                  salonPhone: salon['phone']?.toString(),
                ),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Localisation du salon non disponible')),
            );
          }
        },
        child: Text(
          salon['address']?.toString() ?? 'Adresse inconnue',
          style: TextStyle(
            color: Colors.blue[600],
            decoration: TextDecoration.underline,
          ),
        ),
      ),
    ),
  ],
),
                  if (images.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      '${images.length} photo${images.length > 1 ? 's' : ''} disponible${images.length > 1 ? 's' : ''}',
                      style: TextStyle(color: Colors.blueAccent, fontSize: 14),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildRatingStars(double rating) {
  return Row(
    children: List.generate(5, (index) {
      return Icon(
        index < rating.round() ? Icons.star : Icons.star_border,
        color: Colors.amber,
        size: 20,
      );
    }),
  );
}

  Future<void> _searchSalons(String query) async {
    if (query.isEmpty) return await _loadSalons();

    setState(() {
      isLoading = true;
      searchError = null;
    });

    try {
      final List<dynamic> response = await ApiService.searchSalons(query);
      setState(() {
        salons = response;
        if (salons.isEmpty) {
          searchError = 'Aucun salon trouvé pour "$query"\n\n'
                       '😔 Désolé, nous n\'avons pas trouvé de salon correspondant à votre recherche.\n'
                       'Voulez-vous essayer avec un autre nom ou une autre adresse ?\n\n'
                       '💡 Conseil : Vérifiez l\'orthographe ou essayez des termes plus généraux';
        }
      });
    } catch (e) {
      setState(() {
        searchError = 'Oups ! Quelque chose s\'est mal passé\n\n'
                     '🚧 Nous rencontrons des difficultés techniques\n'
                     'Veuillez réessayer plus tard ou contacter notre support\n\n'
                     'Détail de l\'erreur: ${e.toString()}';
      });
    } finally {
      setState(() => isLoading = false);
    }
  }
}