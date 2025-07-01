import 'package:flutter/material.dart';
import './pages/login_page.dart';
import './pages/register_page.dart';
import './pages/home_page.dart';
import './pages/profile_page.dart';
import './pages/SearchSalonPage.dart';
import './pages/CartPage.dart';
import './pages/order_history.dart';
import './pages/forgot_password_page.dart'; // Nouvelle importation
import './pages/reset_password_page.dart';   // Nouvelle importation
import './wrapper/wrapper.dart';
import './screens/welcome_screen_1.dart';
import './screens/welcome_screen_2.dart';
import 'package:provider/provider.dart';
import './pages/CartProvider.dart';
import './pages/SalonCategoriesPage.dart';
import './pages/offers_page.dart';
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => CartProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      
      debugShowCheckedModeBanner: false,
      title: 'Application Client',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: WillPopScope(
        onWillPop: () async => false,
        child: const WelcomeScreen1(),
          ),  // Ajoutez cette ligne pour gérer l'état de connexion
      routes: {
        '/welcome1': (context) => WelcomeScreen1(),
        '/welcome2': (context) => WelcomeScreen2(),
        '/login': (context) => LoginPage(),
        '/register': (context) => RegisterPage(),
        '/home': (context) => ProtectedRoute(child: HomePage()),
        '/profile': (context) => ProtectedRoute(child: ProfilePage()),
        '/search-salons': (context) => ProtectedRoute(child: SearchSalonPage()),
        '/salon-categories': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return ProtectedRoute(
            child: SalonCategoriesPage(
              salonId: args['salonId'],
              salonName: args['salonName'],
            ),
          );
        },
        '/cart': (context) => ProtectedRoute(child: CartPage()),
        '/order-history': (context) => ProtectedRoute(child: OrderHistoryPage()),
        '/forgot-password': (context) => ForgotPasswordPage(),
        '/reset-password': (context) {
          final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
          return ResetPasswordPage(token: args['token']);
        },
        '/offers': (context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    return ProtectedRoute(
      child: OffersPage(salonId: args['salonId']),
    );
  },
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/reset-password') {
          final args = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(
            builder: (context) => ResetPasswordPage(token: args['token']),
          );
        }
        return null;
      },
      onUnknownRoute: (settings) => MaterialPageRoute(
        builder: (context) => const ProtectedRoute(child: HomePage()),
      ),
    );
    
  }
}