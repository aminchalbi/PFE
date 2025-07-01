import 'package:flutter/material.dart';
import '../services/api_service.dart';

class CartProvider with ChangeNotifier {
  List<Map<String, dynamic>> _cartItems = [];
  double _total = 0;
  bool _isLoading = false;

  List<Map<String, dynamic>> get cartItems => _cartItems;
  double get total => _total;
  bool get isLoading => _isLoading;

Future<void> loadCart() async {
  try {
    _isLoading = true;
    notifyListeners();

    final response = await ApiService.getProfile();
    final cartData = response['cart'] as List? ?? [];

_cartItems = cartData.map((item) {
  if (item == null || item['product'] == null) {
    return null;
  }

  return {
    'product': {
      '_id': item['product']['_id']?.toString() ?? '',
      'name': item['product']['name'] ?? 'Produit inconnu',
      'price': item['price'] ?? 0.0,
      'image': item['product']['image'] ?? '',
      'salon': item['product']['salon']?.toString() ?? '',
      'isOnPromo': item['product']['isOnPromo'] ?? false,
      'promoDetails': item['product']['promoDetails'] ?? {},
    },
    'quantity': item['quantity'] ?? 1,
    'price': item['price'] ?? 0.0,
  };
}).where((item) => item != null).cast<Map<String, dynamic>>().toList();


    _calculateTotal();
  } catch (e) {
    print("Erreur loadCart : $e");
    _cartItems = [];
    _total = 0;
  } finally {
    _isLoading = false;
    notifyListeners();
  }
}

  void _calculateTotal() {
    // Regrouper les éléments par offre
    final offerGroups = <String, List<Map<String, dynamic>>>{};
    final nonOfferItems = <Map<String, dynamic>>[];

    for (var item in _cartItems) {
      if (item['offer'] != null) {
        final offerId = item['offer']['_id'].toString();
        offerGroups[offerId] ??= [];
        offerGroups[offerId]!.add(item);
      } else {
        nonOfferItems.add(item);
      }
    }

    _total = 0;

    // Calculer le total pour les offres
    for (var offerId in offerGroups.keys) {
      final items = offerGroups[offerId]!;
      final offerPrice = items[0]['offer']['price'] as num;
      final quantity = items[0]['quantity'] as num; // Quantité commune pour l'offre
      _total += offerPrice * quantity;
       
    }

    // Calculer le total pour les produits hors offre
    _total += nonOfferItems.fold(0, (sum, item) {
      return sum + (item['price'] * item['quantity']);
    });

    notifyListeners();
  }
}