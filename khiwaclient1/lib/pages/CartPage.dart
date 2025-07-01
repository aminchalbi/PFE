import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../pages/CartProvider.dart';
import 'dart:convert';

class CartPage extends StatefulWidget {
  const CartPage({super.key});

  @override
  _CartPageState createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  bool _isPlacingOrder = false;
  final TextEditingController _tableNumberController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CartProvider>(context, listen: false).loadCart();
    });
  }

  @override
  void dispose() {
    _tableNumberController.dispose();
    super.dispose();
  }

 Future<void> _placeOrder(BuildContext context) async {
  if (!_formKey.currentState!.validate()) return;

  final bool? confirm = await showDialog<bool>(
    context: context,
    builder: (BuildContext context) {
      return AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20.0),
        ),
        title: const Text('Confirmer la commande'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Total: ${Provider.of<CartProvider>(context, listen: false).total.toStringAsFixed(2)} Dt'),
            const SizedBox(height: 8),
            Text('Table: ${_tableNumberController.text}'),
            const SizedBox(height: 16),
            const Text('Voulez-vous vraiment passer cette commande?'),
          ],
        ),
        actions: [
          TextButton(
            child: const Text('Annuler', style: TextStyle(color: Colors.grey)),
            onPressed: () => Navigator.of(context).pop(false),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Confirmer', style: TextStyle(color: Colors.white)),
            onPressed: () => Navigator.of(context).pop(true),
          ),
        ],
      );
    },
  );

  if (confirm != true) return;

  final cartProvider = Provider.of<CartProvider>(context, listen: false);
  setState(() => _isPlacingOrder = true);
  
  try {
    final salonId = cartProvider.cartItems.first['product']['salon'];
    final response = await ApiService.placeOrder(
      cartItems: cartProvider.cartItems,
      salonId: salonId,
      tableNumber: _tableNumberController.text,
    );

    await cartProvider.loadCart();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response['message'] ?? 'Commande passée avec succès!'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      _tableNumberController.clear();
    }
  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  } finally {
    if (mounted) setState(() => _isPlacingOrder = false);
  }
}

  Widget _buildCartItem(Map<String, dynamic> item, BuildContext context) {
  // Vérification de null
  if (item == null || item['product'] == null) {
    return const ListTile(
      title: Text('Produit indisponible'),
      leading: Icon(Icons.error),
    );
  }

  return Card(
    margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
    elevation: 2,
    child: ListTile(
      contentPadding: const EdgeInsets.all(12),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: item['product']['image'] != null && item['product']['image'].isNotEmpty
            ? Image.network(
                'http://192.168.1.13:3000${item['product']['image']}',
                width: 60,
                height: 60,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(Icons.fastfood, size: 40),
              )
            : const Icon(Icons.fastfood, size: 40),
      ),
      title: Text(
        item['product']['name'] ?? 'Produit inconnu',
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${item['price']?.toStringAsFixed(2) ?? '0.00'} Dt × ${item['quantity']}'),
          Text(
            'Sous-total: ${(item['price'] * item['quantity']).toStringAsFixed(2)} Dt',
            style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
          ),
          if (item['product']['isOnPromo'] == true)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                'Promotion: ${item['product']['promoDetails']?['promoLabel'] ?? 'Promo'}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.red[800],
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
        ],
      ),
      trailing: IconButton(
        icon: const Icon(Icons.delete, color: Colors.red),
        onPressed: () => _removeItem(context, item['product']['_id']),
      ),
    ),
  );
}

  Future<void> _removeItem(BuildContext context, String productId) async {
    try {
      await ApiService.removeFromCart(productId);
      await Provider.of<CartProvider>(context, listen: false).loadCart();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_cart_outlined, size: 60, color: Colors.grey),
          const SizedBox(height: 20),
          Text('Votre panier est vide', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          const Text('Parcourez les salons et ajoutez des produits', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildTableNumberInput() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Form(
        key: _formKey,
        child: TextFormField(
          controller: _tableNumberController,
          decoration: InputDecoration(
            labelText: 'Numéro de table',
            hintText: 'Entrez votre numéro de table',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            prefixIcon: const Icon(Icons.table_restaurant),
            filled: true,
            fillColor: Colors.grey[100],
          ),
          keyboardType: TextInputType.number,
          validator: (value) => value?.isEmpty ?? true ? 'Numéro de table requis' : null,
        ),
      ),
    );
  }

  Widget _buildOrderButton(CartProvider cartProvider) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: Theme.of(context).primaryColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onPressed: cartProvider.cartItems.isEmpty || _isPlacingOrder
            ? null
            : () => _placeOrder(context),
        child: _isPlacingOrder
            ? const CircularProgressIndicator(color: Colors.white)
            : Text(
                'Passer la commande (${cartProvider.total.toStringAsFixed(2)} Dt)',
                style: const TextStyle(fontSize: 16, color: Colors.white),
              ),
      ),
    );
  }

  Widget _buildTotalBar(CartProvider cartProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.2),
            spreadRadius: 2,
            blurRadius: 8,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildTableNumberInput(),
          const SizedBox(height: 12),
          _buildOrderButton(cartProvider),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    
    if (kDebugMode) {
      print('Contenu du panier: ${jsonEncode(cartProvider.cartItems)}');
    }

    return Scaffold(
     
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.isLoading) return const Center(child: CircularProgressIndicator());
          
          return RefreshIndicator(
            onRefresh: () => cartProvider.loadCart(),
            child: cartProvider.cartItems.isEmpty
                ? _buildEmptyCart()
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 100),
                    itemCount: cartProvider.cartItems.length,
                    itemBuilder: (context, index) {
                      final item = cartProvider.cartItems[index];
                      return Dismissible(
                        key: Key(item['product']['_id']),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) => _removeItem(context, item['product']['_id']),
                        background: Container(
                          color: Colors.red,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        child: _buildCartItem(item, context),
                      );
                    },
                  ),
          );
        },
      ),
      bottomNavigationBar: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          return cartProvider.isLoading ? const SizedBox() : _buildTotalBar(cartProvider);
        },
      ),
    );
  }
}