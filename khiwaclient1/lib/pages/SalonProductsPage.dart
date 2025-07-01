import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'ProductDetailsPage.dart';
import '../widget/RatingWidget.dart';
import '../widget/ReviewDialog.dart';
import 'CartPage.dart';

class SalonProductsPage extends StatefulWidget {
  final String salonId;
  final String? categoryId;
  final String? categoryName;

  const SalonProductsPage({
    Key? key,
    required this.salonId,
    this.categoryId,
    this.categoryName,
  }) : super(key: key);

  @override
  State<SalonProductsPage> createState() => _SalonProductsPageState();
}
bool _showOnlyPromo = false;
class _SalonProductsPageState extends State<SalonProductsPage> {
  List<dynamic> products = [];
  List<dynamic> filteredProducts = [];
  bool isLoading = true;
  String? errorMessage;
  String salonName = '';
  Map<String, List<dynamic>> productReviews = {};
  Map<String, dynamic>? userData;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _loadSalonAndProducts();
    _searchController.addListener(_filterProducts);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }


  Future<void> _loadUserData() async {
    try {
      final profile = await ApiService.getProfile();
      setState(() {
        userData = profile['user'];
      });
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  Future<void> _loadSalonAndProducts() async {
    try {
      final salonInfo = await ApiService.getSalonDetails(widget.salonId);
      final productsData = widget.categoryId != null
          ? await ApiService.getProductsByCategory(widget.salonId, widget.categoryId!)
          : await ApiService.getProductsBySalon(widget.salonId);
      
      setState(() {
        salonName = salonInfo['salon']['name'] ?? 'Salon';
        if (widget.categoryName != null) {
          salonName += ' - ${widget.categoryName}';
        }
        products = productsData;
        filteredProducts = productsData;
      });

      await _loadAllProductReviews();
    } catch (e) {
      setState(() {
        errorMessage = 'Erreur: ${e.toString()}';
      });
    } finally {
      setState(() => isLoading = false);
    }
  }
 Future<void> _addToCart(Map<String, dynamic> product) async {
  try {
    // Utiliser le prix promo si disponible
    final price = product['isOnPromo'] == true
        ? product['promoDetails']['promoPrice']
        : product['price'];
    
    // Créer une copie du produit avec le bon prix
    final productToAdd = {
      ...product,
      'price': price,
    };

    await ApiService.addToCart(productToAdd['_id'], 1);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product['name']} ajouté au panier'),
        backgroundColor: Colors.green,
      ),
    );
  } catch (e) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Erreur: ${e.toString()}'),
        backgroundColor: Colors.red,
      ),
    );
  }
}

  Future<void> _loadAllProductReviews() async {
    for (var product in products) {
      try {
        final reviews = await ApiService.getProductReviews(product['_id']);
        setState(() {
          productReviews[product['_id']] = reviews;
        });
      } catch (e) {
        print('Error loading reviews for product ${product['_id']}: $e');
      }
    }
  }

  Future<void> _submitReview(String productId, int rating, String? comment, {String? reviewId}) async {
    try {
      final Map<String, dynamic> response;
      
      if (reviewId == null) {
        // Nouvel avis
        response = await ApiService.submitReview(
          salonId: widget.salonId,
          productId: productId,
          rating: rating,
          comment: comment,
        );
      } else {
        // Mise à jour d'un avis existant
        response = await ApiService.updateReview(
          reviewId: reviewId,
          salonId: widget.salonId,
          productId: productId,
          rating: rating,
          comment: comment,
        );
      }
      
      // Recharger les avis
      await _loadAllProductReviews();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response['message'] ?? 'Avis enregistré avec succès')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: ${e.toString()}')),
      );
    }
  }

void _filterProducts() {
  final query = _searchController.text.toLowerCase();
  setState(() {
    filteredProducts = products.where((product) {
      final name = product['name']?.toString().toLowerCase() ?? '';
      final desc = product['description']?.toString().toLowerCase() ?? '';
      
      // Filtre par recherche
      final matchesSearch = name.contains(query) || desc.contains(query);
      
      // Filtre par promotion si activé
      final matchesPromo = !_showOnlyPromo || product['isOnPromo'] == true;
      
      return matchesSearch && matchesPromo;
    }).toList();
  });
}

  Widget _buildReviewButton(String productId) {
    if (userData == null) return const SizedBox();

    final userReview = productReviews[productId]?.firstWhere(
      (r) => r['client']?['_id'] == userData!['_id'],
      orElse: () => null,
    );

    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
      ),
      onPressed: () {
        if (userReview != null) {
          showDialog(
            context: context,
            builder: (_) => ReviewDialog(
              initialRating: userReview['rating'],
              initialComment: userReview['comment'],
              onSubmit: (rating, comment) => _submitReview(
                productId, 
                rating, 
                comment,
                reviewId: userReview['_id'],
              ),
            ),
          );
        } else {
          showDialog(
            context: context,
            builder: (_) => ReviewDialog(
              onSubmit: (rating, comment) => _submitReview(productId, rating, comment),
            ),
          );
        }
      },
      child: Text(userReview != null ? 'Modifier mon avis' : 'Donner mon avis'),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Menu - $salonName'),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSalonAndProducts,
          ),
           _buildCartIcon(context), 
        ],
      ),
      body: Column(
        children: [
          SwitchListTile(
          title: Text('Afficher seulement les promos'),
          value: _showOnlyPromo,
          onChanged: (value) {
            setState(() {
              _showOnlyPromo = value;
              _filterProducts();
            });
          },
        ),
          _buildSearchBar(),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }
Widget _buildPriceWithPromo(Map<String, dynamic> product) {
  
  if (product['isOnPromo'] == true) {
    final promoDetails = product['promoDetails'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${product['price']?.toStringAsFixed(2) ?? '0.00'} Dt',
          style: TextStyle(
            fontSize: 16,
            decoration: TextDecoration.lineThrough,
            color: Colors.grey,
          ),
        ),
        Text(
          '${promoDetails['promoPrice']?.toStringAsFixed(2) ?? '0.00'} Dt',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).primaryColor,
          ),
        ),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          margin: EdgeInsets.only(top: 4),
          decoration: BoxDecoration(
            color: Colors.red[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'Promo: ${promoDetails['promoLabel']}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.red[800],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  } else {
    return Text(
      '${product['price']?.toStringAsFixed(2) ?? '0.00'} Dt',
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Theme.of(context).primaryColor,
      ),
    );
  }
}

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Rechercher un produit...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.grey[200],
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 20),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (errorMessage != null) {
      return Center(child: Text(errorMessage!));
    }
    
    if (filteredProducts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 50, color: Colors.grey),
            const SizedBox(height: 20),
            Text(_searchController.text.isEmpty
                ? 'Aucun produit disponible'
                : 'Aucun résultat trouvé'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: filteredProducts.length,
      itemBuilder: (context, index) {
        final product = filteredProducts[index];
        return _buildProductCard(product);
      },
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
  final reviews = productReviews[product['_id']] ?? [];
  final averageRating = reviews.isNotEmpty
      ? reviews.map((r) => r['rating'] as int).reduce((a, b) => a + b) / reviews.length
      : 0;

  return Card(
    elevation: 4,
    margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(15),
    ),
    child: InkWell(
      borderRadius: BorderRadius.circular(15),
      onTap: () => _navigateToProductDetails(product['_id']),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
            child: _buildProductImage(product),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Nom du produit
                Text(
                  product['name'] ?? 'Produit sans nom',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                
                // Prix et bouton panier
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    
                   _buildPriceWithPromo(product),
                    
                    ElevatedButton.icon(
                      icon: const Icon(Icons.add_shopping_cart, size: 20),
                      label: const Text('Panier'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: () => _addToCart(product),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Description
                if (product['description'] != null && 
                    product['description'].toString().isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      product['description'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                
                // Ingrédients
                _buildIngredients(product),
                const Divider(height: 20),
                
                // Section avis
                _buildReviewsSection(product['_id'], reviews, averageRating.toDouble()),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}


Widget _buildCartIcon(BuildContext context) {
  return IconButton(
    icon: Stack(
      children: [
        const Icon(Icons.shopping_cart),
     
      ],
    ),
    onPressed: () {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const CartPage()),
      );
    },
  );
}
  Widget _buildIngredients(Map<String, dynamic> product) {
    final ingredientNames = _getIngredientNames(product);
    if (ingredientNames.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ingrédients:',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 4,
          runSpacing: 4,
          children: ingredientNames.map((name) => Chip(
            label: Text(
              name,
              style: const TextStyle(fontSize: 12),
            ),
            backgroundColor: Colors.grey[200],
            visualDensity: VisualDensity.compact,
          )).toList(),
        ),
      ],
    );
  }

  List<String> _getIngredientNames(Map<String, dynamic> product) {
    try {
      if (product['ingredients'] == null) return [];
      
      if (product['ingredients'].isNotEmpty && product['ingredients'][0] is String) {
        return List<String>.from(product['ingredients']);
      }
      
      if (product['ingredients'][0]['ingredient'] is Map && 
          product['ingredients'][0]['ingredient']['name'] != null) {
        return List<dynamic>.from(product['ingredients'])
            .map((ing) => ing['ingredient']['name'].toString())
            .toList();
      }
      
      return [];
    } catch (e) {
      print('Erreur lors de la récupération des ingrédients: $e');
      return [];
    }
  }

  Widget _buildReviewsSection(String productId, List<dynamic> reviews, double averageRating) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Avis (${reviews.length})',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Row(
              children: [
                RatingWidget(
                  initialRating: averageRating.round(),
                  onRatingChanged: (_) {},
                  interactive: false,
                  size: 20,
                ),
                const SizedBox(width: 4),
                Text(
                  averageRating.toStringAsFixed(1),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (reviews.isNotEmpty)
          ...reviews.take(2).map((review) => _buildReviewItem(review)),
        if (reviews.length > 2)
          TextButton(
            onPressed: () => _navigateToProductDetails(productId),
            child: const Text('Voir tous les avis'),
          ),
        const SizedBox(height: 8),
        _buildReviewButton(productId),
      ],
    );
  }

  Widget _buildReviewItem(Map<String, dynamic> review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                review['client']['username'] ?? 'Anonyme',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                _formatDate(review['createdAt']),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          RatingWidget(
            initialRating: review['rating'],
            onRatingChanged: (_) {},
            interactive: false,
            size: 16,
          ),
          if (review['comment'] != null && review['comment'].isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                review['comment'],
                style: const TextStyle(fontSize: 14),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return '';
    }
  }

Widget _buildProductImage(Map<String, dynamic> product) {
  final imageUrl = product['image'];
  final height = MediaQuery.of(context).size.width * 0.5;
  
  return Stack(
    children: [
      // Image de fond
      if (imageUrl == null || imageUrl.isEmpty)
        Container(
          height: height,
          color: Colors.grey[200],
          child: Center(
            child: Icon(Icons.fastfood, size: 50, color: Colors.grey[600]),
          ),
        )
      else
        Image.network(
          imageUrl.startsWith('http') ? imageUrl : 'http://192.168.108.153:3000$imageUrl',
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          // ... loadingBuilder et errorBuilder existants ...
        ),
      
      // Badge de promotion
      if (product['isOnPromo'] == true)
        Positioned(
          top: 10,
          right: 10,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.red,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'PROMO',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
    ],
  );
}

  void _navigateToProductDetails(String productId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailsPage(productId: productId),
      ),
    );
  }
}