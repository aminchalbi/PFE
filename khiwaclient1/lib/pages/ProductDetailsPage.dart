import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import 'CartProvider.dart';

class ProductDetailsPage extends StatefulWidget {
  final String productId;

  const ProductDetailsPage({super.key, required this.productId});

  @override
  _ProductDetailsPageState createState() => _ProductDetailsPageState();
}

class _ProductDetailsPageState extends State<ProductDetailsPage> {
  Map<String, dynamic>? product;
  bool isLoading = true;
  String? errorMessage;
  int quantity = 1;

  @override
  void initState() {
    super.initState();
    _loadProductDetails();
  }

  Future<void> _loadProductDetails() async {
    try {
      final response = await ApiService.getProductDetails(widget.productId);
      if (response['success'] == true) {
        setState(() {
          product = response['product'];
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = response['error'] ?? 'Erreur inconnue';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Erreur: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  Future<void> _addToCart() async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text('Ajout au panier...'),
            ],
          ),
          duration: Duration(seconds: 2),
        ),
      );

      await ApiService.addToCart(product!['_id'].toString(), quantity);

      if (mounted) {
        await Provider.of<CartProvider>(context, listen: false).loadCart();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${product!['name']} ajouté au panier (x$quantity)'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails du Produit'),
        backgroundColor: Colors.teal,
        elevation: 0,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (errorMessage != null) {
      return Center(child: Text(errorMessage!));
    }
    if (product == null) {
      return const Center(child: Text('Produit non trouvé'));
    }
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildProductImage(),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProductHeader(),
                const SizedBox(height: 16),
                _buildProductDescription(),
                const SizedBox(height: 16),
                if (product?['ingredients'] != null) _buildIngredientsList(),
                const SizedBox(height: 24),
                _buildQuantitySelector(),
                const SizedBox(height: 24),
                _buildAddToCartButton(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductImage() {
    final imageUrl = product?['image'];
    final screenWidth = MediaQuery.of(context).size.width;
    
    return Container(
      height: screenWidth * 0.8,
      width: double.infinity,
      color: Colors.grey[200],
      child: imageUrl == null || imageUrl.isEmpty
          ? const Center(child: Icon(Icons.fastfood, size: 100, color: Colors.grey))
          : Image.network(
              imageUrl.startsWith('http') 
                  ? imageUrl 
                  : 'http://192.168.80.153:3000$imageUrl',
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded / 
                          loadingProgress.expectedTotalBytes!
                        : null,
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return const Center(
                  child: Icon(Icons.broken_image, size: 100, color: Colors.red),
                );
              },
            ),
    );
  }

  Widget _buildProductHeader() {
  final isOnPromo = product?['isOnPromo'] ?? false;
  final promoPrice = isOnPromo ? product?['promoDetails']?['promoPrice']?.toStringAsFixed(2) : null;
  final originalPrice = product?['price']?.toStringAsFixed(2) ?? '0.00';

  return Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product?['name'] ?? 'Produit sans nom',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            if (isOnPromo) ...[
              Text(
                '$originalPrice Dt',
                style: const TextStyle(
                  fontSize: 18,
                  decoration: TextDecoration.lineThrough,
                  color: Colors.grey,
                ),
              ),
              Text(
                '$promoPrice Dt',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Promotion : ${product?['promoDetails']?['promoLabel'] ?? 'Offre spéciale'}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.red,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ] else
              Text(
                '$originalPrice Dt',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.teal,
                ),
              ),
          ],
        ),
      ),
    ],
  );
}

  Widget _buildProductDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Description',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          product?['description'] ?? 'Aucune description disponible',
          style: const TextStyle(fontSize: 16),
        ),
      ],
    );
  }

  Widget _buildIngredientsList() {
    final ingredients = product?['ingredients'] as List? ?? [];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ingrédients',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ingredients.map((ingredient) {
            final name = ingredient['ingredient']?['name']?.toString() ?? 'Ingrédient inconnu';
            return Chip(
              label: Text(name),
              backgroundColor: Colors.grey[200],
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildQuantitySelector() {
    return Column(
      children: [
        const Text(
          'Quantité',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.remove_circle_outline, size: 30),
              onPressed: () {
                if (quantity > 1) {
                  setState(() {
                    quantity--;
                  });
                }
              },
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '$quantity',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_circle_outline, size: 30),
              onPressed: () {
                setState(() {
                  quantity++;
                });
              },
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAddToCartButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: Colors.teal,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onPressed: _addToCart,
        child: const Text(
          'Ajouter au panier',
          style: TextStyle(fontSize: 18, color: Colors.white),
        ),
      ),
    );
  }
}