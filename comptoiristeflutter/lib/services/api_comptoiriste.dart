import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiComptoiriste {
  static const String baseUrl = 'http://192.168.108.153:3000/api/comptoiriste';
  final _storage = const FlutterSecureStorage();

  Future<String?> _getToken() async {
    return await _storage.read(key: 'token');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> loginComptoiriste(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        body: json.encode({'email': email, 'password': password}),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _storage.write(key: 'token', value: data['token']);
        await _storage.write(key: 'user', value: json.encode(data['user']));
        return data;
      } else {
        throw json.decode(response.body)['error'] ?? 'Login failed';
      }
    } catch (e) {
      throw 'Login error: $e';
    }
  }

  Future<List<dynamic>> fetchOrders() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['orders'];
      } else {
        throw json.decode(response.body)['error'] ?? 'Failed to load orders';
      }
    } catch (e) {
      throw 'Orders fetch error: $e';
    }
  }

  Future<dynamic> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/orders/$orderId/status'),
        body: json.encode({'status': status}),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw json.decode(response.body)['error'] ?? 'Update failed';
      }
    } catch (e) {
      throw 'Update error: $e';
    }
  }

  Future<List<dynamic>> fetchRecentClients() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/clients/recent'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['clients'];
      } else {
        throw json.decode(response.body)['error'] ?? 'Failed to load clients';
      }
    } catch (e) {
      throw 'Clients fetch error: $e';
    }
  }

  Future<Map<String, dynamic>> fetchOrdersWithStats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/orders'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw json.decode(response.body)['error'] ?? 'Failed to load orders with stats';
      }
    } catch (e) {
      throw 'Orders with stats fetch error: $e';
    }
  }
}