import 'package:flutter/material.dart';
import '../pages/login_page.dart';

class ProtectedRoute extends StatelessWidget {
  final Widget child;

  const ProtectedRoute({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    // Vérifier si l'utilisateur est connecté (à implémenter)
    final isLoggedIn = true; // Exemple

    if (!isLoggedIn) {
      return LoginPage();
    } else {
      return child;
    }
  }
}

// Exemple d'utilisation
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProtectedRoute(
      child: Scaffold(
        appBar: AppBar(
          title: Text('Accueil'),
          actions: [
            IconButton(
              icon: Icon(Icons.logout),
              onPressed: () {
                // Déconnexion (à implémenter)
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => LoginPage()),
                );
              },
            ),
          ],
        ),
        body: Center(child: Text('Bienvenue')),
      ),
    );
  }
}
