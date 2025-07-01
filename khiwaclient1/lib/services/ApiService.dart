import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _chatbaseUrl = "http://192.168.1.22:3000/api/chat";
  static final FlutterSecureStorage storage = FlutterSecureStorage();

  static Future<String> _getToken() async {
    return await storage.read(key: 'token') ?? '';
  }

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

      return json.decode(response.body);
    } catch (e) {
      throw Exception('Chatbot error: $e');
    }
  }
static Future<Map<String, dynamic>> getChatHistory(String userId) async {
  final token = await _getToken();
  final response = await http.get(
    Uri.parse('$_chatbaseUrl/history/$userId'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  final decoded = json.decode(response.body) as Map<String, dynamic>;
  
  // Conversion sécurisée des IDs en String si nécessaire
  if (decoded['chat'] != null && decoded['chat']['id'] != null) {
    decoded['chat']['id'] = decoded['chat']['id'].toString();
  }
  
  return decoded;
}
  static Future<void> clearChatHistory(String userId) async {
    final token = await _getToken();
    await http.delete(
      Uri.parse('$_chatbaseUrl/history/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
  }
}