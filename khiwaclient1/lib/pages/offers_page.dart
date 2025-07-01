import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:provider/provider.dart';
import '../pages/CartProvider.dart';
import 'dart:convert';

class OffersPage extends StatefulWidget {
  final String salonId;

  const OffersPage({Key? key, required this.salonId}) : super(key: key);

  @override
  _OffersPageState createState() => _OffersPageState();
}

class _OffersPageState extends State<OffersPage> {
  List<dynamic> offers = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadOffers();
  }

  Future<void> _loadOffers() async {
    try {
      final offersData = await ApiService.getActiveOffers(widget.salonId);
      print('Offres reçues: ${jsonEncode(offersData)}');
      setState(() {
        offers = offersData;
        isLoading = false;
      });
    } catch (e) {
      print('Erreur dans _loadOffers: $e');
      setState(() {
        errorMessage = 'Erreur: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  Future<void> _addOfferToCart(String offerId) async {
    try {
      await ApiService.addOfferToCart(widget.salonId, offerId);
      await Provider.of<CartProvider>(context, listen: false).loadCart();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Offre ajoutée au panier avec succès !'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offres spéciales'),
        centerTitle: true,
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

    if (offers.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_offer_outlined, size: 50, color: Colors.grey),
            SizedBox(height: 16),
            Text('Aucune offre disponible actuellement'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: offers.length,
      itemBuilder: (context, index) {
        final offer = offers[index];
        return Card(
          elevation: 4,
          margin: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (offer['image'] != null)
                Image.network(
                  offer['image'],
                  height: 150,
                  fit: BoxFit.cover,
                ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            offer['name'],
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_shopping_cart, color: Colors.blue),
                          onPressed: () => _addOfferToCart(offer['_id']),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (offer['description'] != null)
                      Text(
                        offer['description'],
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    const SizedBox(height: 12),
                    Text(
                      'Prix: ${double.parse(offer['price'].toString()).toStringAsFixed(2)} Dt',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Jours restants: ${int.parse(offer['remainingDays'].toString())}',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Produits inclus:',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    ...offer['products'].map<Widget>((product) => ListTile(
                          leading: product['product']['image'] != null
                              ? Image.network(
                                  product['product']['image'],
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.cover,
                                )
                              : const Icon(Icons.fastfood),
                          title: Text(product['product']['name']),
                          subtitle: Text('Quantité: ${int.parse(product['quantity'].toString())}'),
                        )),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}