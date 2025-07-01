import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../pages/login_page.dart';
import '../pages/home_page.dart';
import '../screens/welcome_screen_1.dart';

class Wrapper extends StatelessWidget {
  const Wrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _checkAuth(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        
        if (snapshot.hasError || !snapshot.data!) {
          return const WelcomeScreen1(); // ou LoginPage() selon votre flux
        }
        
        return const HomePage();
      },
    );
  }

  Future<bool> _checkAuth() async {
    try {
      final token = await ApiService.storage.read(key: 'token');
      return token != null && token.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}

class ProtectedRoute extends StatelessWidget {
  final Widget child;

  const ProtectedRoute({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _checkAuth(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        
        if (snapshot.hasError || !snapshot.data!) {
          return const LoginPage();
        }
        
        return WillPopScope(
          onWillPop: () async => true,
          child: child,
        );
      },
    );
  }

  Future<bool> _checkAuth() async {
    try {
      final token = await ApiService.storage.read(key: 'token');
      return token != null && token.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}