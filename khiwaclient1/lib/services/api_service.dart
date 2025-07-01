import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http_parser/http_parser.dart';
import 'dart:io';
import 'dart:async'; 
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

class ApiService {
  static const String  _clientbaseUrl = "http://192.168.108.153:3000/api/client" ; 
  static const String _chatbaseUrl = "http://192.168.1.15:3000/api/chat" ; 

  static final FlutterSecureStorage storage = FlutterSecureStorage();
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );
  
  // Récupérer le token
  static Future<String> _getToken() async {
    return await storage.read(key: 'token') ?? '';
  }

  // Enregistrer un client
  static Future<Map<String, dynamic>> registerClient(Map<String, dynamic> userData) async {
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(userData),
    );
    return jsonDecode(response.body);
  }

  // Connexion du client
  static Future<Map<String, dynamic>> loginClient(Map<String, dynamic> credentials) async {
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(credentials),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(key: 'token', value: data['token']); // Sauvegarder le token
      return data;
    } else {
      throw Exception('Erreur lors de la connexion: ${response.statusCode}');
    }
  }
  static Future<List<dynamic>> getActiveOffers(String salonId) async {
  try {
    final response = await http.get(
      Uri.parse('$_clientbaseUrl/offers/active?salonId=$salonId'),
      headers: {'Authorization': 'Bearer ${await _getToken()}'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['offers'] ?? [];
    } else {
      throw Exception('Erreur ${response.statusCode}: ${response.body}');
    }
  } catch (e) {
    debugPrint('Erreur getActiveOffers: $e');
    rethrow;
  }
}

static Future<Map<String, dynamic>> addOfferToCart(String salonId, String offerId) async {
  try {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/cart/add-offer'), // Corrected endpoint
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'salonId': salonId,
        'offerId': offerId,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Erreur ${response.statusCode}: ${response.body}');
    }
  } catch (e) {
    debugPrint('Erreur addOfferToCart: $e');
    rethrow;
  }
}
// ApiService.dart
static Future<Map<String, dynamic>> signInWithGoogle() async {
  try {
    // Initialiser GoogleSignIn avec le client ID
    final GoogleSignIn googleSignIn = GoogleSignIn(
      clientId: '20292548346-0etattmcaudqojncg51aljabi2u2q44c.apps.googleusercontent.com', // Client ID Android
      serverClientId: '20292548346-tm7202gslviod2l79hdcg1gcv5ilbgio.apps.googleusercontent.com', // Client ID serveur
      scopes: ['email', 'profile'],
    );

    // Lancer le flux d'authentification
    final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
    if (googleUser == null) {
      throw Exception('Connexion Google annulée par l\'utilisateur');
    }

    // Obtenir le token d'authentification
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final String? idToken = googleAuth.idToken;

    if (idToken == null) {
      throw Exception('Aucun token ID reçu de Google');
    }

    // Envoyer le token au backend
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/google-auth'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': idToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['token'] != null) {
        await storage.write(key: 'token', value: data['token']);
        return {
          'success': true,
          'user': data['user'],
          'token': data['token'],
          'message': data['message'] ?? 'Connexion réussie',
        };
      } else {
        throw Exception('Token non reçu du serveur');
      }
    } else {
      final errorData = jsonDecode(response.body);
      throw Exception(errorData['error'] ?? 'Erreur serveur: ${response.statusCode}');
    }
  } catch (e) {
    debugPrint('Erreur Google Sign-In: $e');
    rethrow;
  }
}
  
static Future<List<dynamic>> getPromoProducts(String salonId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/promo-products?salonId=$salonId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['products'] ?? [];
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}




  static Future<Map<String, dynamic>> verifyResetCode(String email, String code) async {
  final response = await http.post(
    Uri.parse('$_clientbaseUrl/verify-reset-code'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'code': code}),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Code invalide ou expiré');
  }
}

  // Récupérer les produits d'un salon
  static Future<List<dynamic>> getProductsBySalon(String salonId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/products-by-salon?salonId=$salonId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['products'];
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

  // Passer une commande
static Future<Map<String, dynamic>> placeOrder({
  required List<dynamic> cartItems,
  required String salonId,
  required String tableNumber,
}) async {
  try {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/place-order'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'cartItems': cartItems.map((item) => {
          'product': item['product']['_id'], // ID seulement
          'quantity': item['quantity'],
          'price': item['price'],           // Prix du panier
        }).toList(),
        'salonId': salonId,
        'tableNumber': tableNumber,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Erreur: ${response.statusCode}");
    }
  } catch (e) {
    throw Exception("Erreur placeOrder: $e");
  }
}
  // Récupérer l'historique des commandes
static Future<List<dynamic>> getOrderHistory() async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/order-history'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Retourne directement la liste ou data.orders selon votre API
    return data is List ? data : data['orders'] ?? [];
  } else {
    throw Exception('Failed to load order history');
  }
}

  // Mettre à jour le profil
static Future<Map<String, dynamic>> updateProfile({
  required String firstName,
  required String lastName,
  required String email,
  required String phone,
  required File? imageFile,
}) async {
  final token = await _getToken();
  final uri = Uri.parse('$_clientbaseUrl/update-profile');

  try {
    var request = http.MultipartRequest('PUT', uri)
      ..headers['Authorization'] = 'Bearer $token'
      ..fields['firstName'] = firstName
      ..fields['lastName'] = lastName
      ..fields['email'] = email
      ..fields['phone'] = phone;

    if (imageFile != null) {
      final file = await http.MultipartFile.fromPath(
        'image',
        imageFile.path,
        contentType: MediaType('image', 'jpeg'),
      );
      request.files.add(file);
    }

    final response = await request.send();
    final responseData = await response.stream.bytesToString();

    if (response.statusCode == 200) {
      return jsonDecode(responseData);
    } else {
      // Essayez de parser le message d'erreur
      try {
        final errorData = jsonDecode(responseData);
        throw Exception(errorData['error'] ?? 'Erreur inconnue');
      } catch (_) {
        throw Exception('Erreur ${response.statusCode}: $responseData');
      }
    }
  } catch (e) {
    print('Erreur dans updateProfile: $e');
    rethrow;
  }
}
  // Rechercher des salons
static Future<List<dynamic>> searchSalons(String query) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/search-salons?query=$query'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
  
  if (response.statusCode == 200) {
    final Map<String, dynamic> data = jsonDecode(response.body);
    return data['salons']; // Retourne directement la liste des salons
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

  // Mettre à jour l'image de profil
  static Future<Map<String, dynamic>> updateProfileImage(String imageUrl) async {
    final response = await http.put(
      Uri.parse('$_clientbaseUrl/update-profile-image'),
      headers: {'Authorization': 'Bearer ${await _getToken()}', 'Content-Type': 'application/json'},
      body: jsonEncode({'imageUrl': imageUrl}),
    );
    return jsonDecode(response.body);
  }

  // Ajouter un produit au panier
static Future<List<dynamic>> addToCart(String productId, int quantity) async {
  try {
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/add-to-cart'),
      headers: {
        'Authorization': 'Bearer ${await _getToken()}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'productId': productId,
        'quantity': quantity,
        // Pas besoin d'envoyer le prix : le backend le calcule
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['cart'] ?? [];
    } else {
      throw Exception("Erreur : ${response.statusCode}");
    }
  } catch (e) {
    throw Exception("Erreur addToCart : $e");
  }
}
  // Récupérer le profil
static Future<Map<String, dynamic>> getProfile() async {
  final token = await _getToken();
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/get-profile'),
    headers: {'Authorization': 'Bearer $token'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Retournez à la fois user et cart
    return {
      'user': data['user'],
      'cart': data['cart'] ?? []
    };
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}


  // Récupérer les salons
static Future<List<dynamic>> getSalons() async {
  final token = await _getToken();
   print('Token envoyé: $token'); 
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/get-salons'),
    headers: {'Authorization': 'Bearer $token'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['salons'];
  } else {
    throw Exception('Erreur lors de la récupération des salons: ${response.statusCode}');
  }
}

  // Retirer un produit du panier
  static Future<Map<String, dynamic>> removeFromCart(String productId) async {
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/remove-from-cart'),
      headers: {'Authorization': 'Bearer ${await _getToken()}', 'Content-Type': 'application/json'},
      body: jsonEncode({'productId': productId}),
    );
    return jsonDecode(response.body);
  }

  // Récupérer les détails d'un produit
static Future<Map<String, dynamic>> getProductDetails(String productId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/product-details?productId=$productId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}
  // Récupérer le statut d'une commande
  static Future<Map<String, dynamic>> getOrderStatus(String orderId) async {
    final response = await http.get(
      Uri.parse('$_clientbaseUrl/order-status?orderId=$orderId'),
      headers: {'Authorization': 'Bearer ${await _getToken()}'},
    );
    return jsonDecode(response.body);
  }


  static Future<List<dynamic>> getNotifications() async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/notifications'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['notifications'] is List ? data['notifications'] : [];
  }
  throw Exception('Failed to load notifications');
}

static Future<void> markNotificationsAsRead() async {
  await http.patch(
    Uri.parse('$_clientbaseUrl/notifications/mark-as-read'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
}


static Future<Map<String, dynamic>> forgotPassword(String email) async {
  try {
    final response = await http.post(
      Uri.parse('$_clientbaseUrl/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    final data = jsonDecode(response.body);
    
    if (response.statusCode != 200) {
      throw Exception(data['error'] ?? 'Erreur inconnue');
    }
    
    return data;
  } catch (e) {
    throw Exception('Échec de l\'envoi du lien de réinitialisation: ${e.toString()}');
  }
}

// Réinitialisation du mot de passe
static Future<Map<String, dynamic>> resetPassword(String token, String newPassword) async {
  final response = await http.post(
    Uri.parse('$_clientbaseUrl/reset-password'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'token': token,
      'newPassword': newPassword,
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}
static Future<Map<String, dynamic>> getSalonDetails(String salonId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/salon-details?salonId=$salonId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}
static Future<Map<String, dynamic>> updateReview({
  required String reviewId,
  required String salonId,
  required String productId,
  required int rating,
  String? comment,
}) async {
  final token = await _getToken();
  final response = await http.put(
    Uri.parse('$_clientbaseUrl/update-review'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    },
    body: jsonEncode({
      'reviewId': reviewId,
      'salonId': salonId,
      'productId': productId,
      'rating': rating,
      'comment': comment
    }),
  );
  
  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    // Ajoutez ce log pour voir la réponse d'erreur
    print('Error response: ${response.statusCode} - ${response.body}');
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

static Future<Map<String, dynamic>> changePassword({
  required String currentPassword,
  required String newPassword,
}) async {
  final token = await _getToken();
  final response = await http.put(
    Uri.parse('$_clientbaseUrl/change-password'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

// Dans ApiService.dart
static Future<void> cleanOldOrders() async {
  await http.delete(
    Uri.parse('$_clientbaseUrl/clean-old-orders'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
}

static Future<void> cleanOldNotifications() async {
  await http.delete(
    Uri.parse('$_clientbaseUrl/clean-old-notifications'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
}

static Future<Map<String, dynamic>> submitReview({
  required String salonId,
  required String productId,
  required int rating,
  String? comment,
}) async {
  final token = await _getToken();
  final response = await http.post(
    Uri.parse('$_clientbaseUrl/submit-review'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    },
    body: jsonEncode({
      'salonId': salonId,
      'productId': productId,
      'rating': rating,
      'comment': comment
    }),
  );
  return jsonDecode(response.body);
}

static Future<List<dynamic>> getProductReviews(String productId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/product-reviews/$productId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
  final data = jsonDecode(response.body);
  return data['reviews'] ?? [];
}

static Future<List<dynamic>> getSalonReviews(String salonId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/salon-reviews/$salonId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );
  final data = jsonDecode(response.body);
  return data['reviews'] ?? [];
}
static Future<List<dynamic>> getCategoriesBySalon(String salonId) async {
  try {
    final response = await http.get(
      Uri.parse('$_clientbaseUrl/categories-by-salon?salonId=$salonId'),
      headers: {'Authorization': 'Bearer ${await _getToken()}'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
        return data['categories'] ?? [];
      }
      throw Exception(data['error'] ?? 'Unknown error');
    } else {
      throw Exception('Failed to load categories: ${response.statusCode}');
    }
  } catch (e) {
    debugPrint('Error in getCategoriesBySalon: $e');
    rethrow;
  }
}

static Future<List<dynamic>> getProductsByCategory(String salonId, String categoryId) async {
  final response = await http.get(
    Uri.parse('$_clientbaseUrl/products-by-category?salonId=$salonId&categoryId=$categoryId'),
    headers: {'Authorization': 'Bearer ${await _getToken()}'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['products'] ?? [];
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

// Remplacez par votre URL

  // Méthode pour récupérer le token JWT
  

  // Chat avec le bot
static Future<Map<String, dynamic>> chatWithBot({
  required String userId,
  required String message,
}) async {
  try {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse('$_chatbaseUrl/chat'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({
        'userId': userId,
        'message': message,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Erreur serveur: ${response.statusCode} - ${response.body}');
    }
  } catch (e) {
    debugPrint('Erreur chatWithBot: $e');
    throw Exception('Échec de la communication avec le serveur');
  }
}

static Future<Map<String, dynamic>> cancelOrder({
  required String orderId,
  required String reason,
}) async {
  final token = await _getToken();
  final response = await http.post(
    Uri.parse('$_clientbaseUrl/cancel-order'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'orderId': orderId,
      'reason': reason,
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('Erreur ${response.statusCode}: ${response.body}');
  }
}

  // Obtenir les suggestions
  static Future<List<dynamic>> getSuggestions(String query) async {
    try {
      final token = await _getToken();
      final url = Uri.parse('$_chatbaseUrl/api/suggestions?query=${Uri.encodeQueryComponent(query)}');

      final response = await http.get(
        url,
        headers: {
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      final decoded = json.decode(response.body);
      
      if (response.statusCode == 200) {
        return decoded['suggestions'] ?? [];
      } else {
        throw Exception(decoded['error'] ?? 'HTTP ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Suggestions error: $e');
      rethrow;
    }
  }

  // Obtenir l'historique du chat
static Future<Map<String, dynamic>> getChatHistory(String userId) async {
  try {
    final token = await _getToken();
    final url = Uri.parse('$_chatbaseUrl/history/$userId');

    final response = await http.get(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ).timeout(const Duration(seconds: 15));

    final decoded = json.decode(response.body);
    
    if (response.statusCode == 200) {
      return decoded;
    } else {
      throw Exception(decoded['error'] ?? 'HTTP ${response.statusCode}');
    }
  } catch (e) {
    debugPrint('Get history error: $e');
    rethrow;
  }
}

static Future<Map<String, dynamic>> clearChatHistory(String userId) async {
  try {
    final token = await _getToken();
    final url = Uri.parse('$_chatbaseUrl/history/$userId');

    final response = await http.delete(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ).timeout(const Duration(seconds: 15));

    return json.decode(response.body);
  } catch (e) {
    debugPrint('Clear history error: $e');
    rethrow;
  }
}

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final decoded = json.decode(response.body) as Map<String, dynamic>;
    
    if (response.statusCode == 200) {
      return decoded;
    } else {
      throw Exception(decoded['error'] ?? 'HTTP ${response.statusCode}');
    }
  }
}



