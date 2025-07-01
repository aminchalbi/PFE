import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'SalonProductsPage.dart';
import '../pages/offers_page.dart'; // Import OffersPage

// Palette de couleurs moderne
const Color primaryColor = Color(0xFF1E88E5); // Bleu principal
const Color secondaryColor = Color(0xFF4FC3F7); // Bleu clair
const Color backgroundColor = Color(0xFFF5F7FA); // Fond gris clair
const Color cardColor = Colors.white;
const Color textColor = Color(0xFF212121); // Texte principal
const Color secondaryTextColor = Color(0xFF757575); // Texte secondaire
const Color accentColor = Color(0xFFFFA726); // Orange pour accents
const Color errorColor = Color(0xFFE57373); // Rouge pour erreurs

class SalonCategoriesPage extends StatefulWidget {
  final String salonId;
  final String salonName;

  const SalonCategoriesPage({
    Key? key,
    required this.salonId,
    required this.salonName,
  }) : super(key: key);

  @override
  _SalonCategoriesPageState createState() => _SalonCategoriesPageState();
}

class _SalonCategoriesPageState extends State<SalonCategoriesPage> {
  List<dynamic> categories = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  // Charge les catégories depuis l'API
  Future<void> _loadCategories() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final categoriesData = await ApiService.getCategoriesBySalon(widget.salonId);
      if (categoriesData == null || categoriesData is! List) {
        throw Exception('Données de catégories invalides');
      }
      setState(() {
        categories = categoriesData;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Erreur lors du chargement des catégories : ${e.toString()}';
        isLoading = false;
      });
      _showErrorSnackbar('Erreur : ${e.toString()}');
    }
  }

  // Associe une icône à une catégorie
  IconData _getCategoryIcon(String categoryName) {
    final name = categoryName.toLowerCase();

    if (name.contains('café') || name.contains('coffee')) return Icons.coffee;
    if (name.contains('jus') || name.contains('juice')) return Icons.local_drink;
    if (name.contains('boisson') || name.contains('drink')) return Icons.local_bar;
    if (name.contains('dessert') || name.contains('sweet')) return Icons.cake;
    if (name.contains('salade') || name.contains('salad')) return Icons.eco;
    if (name.contains('sandwich') || name.contains('burger')) return Icons.fastfood;
    if (name.contains('pizza')) return Icons.local_pizza;
    if (name.contains('viande') || name.contains('meat')) return Icons.set_meal;

    return Icons.category;
  }

  // Affiche une notification d'erreur
  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: errorColor,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.only(bottom: 20, left: 20, right: 20),
        duration: const Duration(seconds: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  // Navigue vers la page des offres
  void _navigateToOffers() {
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => OffersPage(
          salonId: widget.salonId,
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOut;
          var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          return SlideTransition(
            position: animation.drive(tween),
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text(
          'Menu - ${widget.salonName}',
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
            color: Colors.white,
            letterSpacing: 0.5,
          ),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.local_offer),
            onPressed: _navigateToOffers,
            tooltip: 'Voir les offres',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCategories,
            tooltip: 'Rafraîchir',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  // Construit le corps de la page
  Widget _buildBody() {
    if (isLoading) {
      return Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(secondaryColor),
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 50,
                color: secondaryTextColor,
              ),
              const SizedBox(height: 16),
              Text(
                errorMessage!,
                style: TextStyle(
                  color: textColor,
                  fontSize: 16,
                  letterSpacing: 0.3,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadCategories,
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  elevation: 2,
                ),
                child: const Text(
                  'Réessayer',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (categories.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.category,
              size: 50,
              color: secondaryTextColor,
            ),
            const SizedBox(height: 16),
            Text(
              'Aucune catégorie disponible',
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCategories,
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                elevation: 2,
              ),
              child: const Text(
                'Réessayer',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: secondaryColor,
      backgroundColor: cardColor,
      onRefresh: _loadCategories,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.builder(
          physics: const BouncingScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.85,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) => _buildCategoryCard(categories[index]),
        ),
      ),
    );
  }

  // Construit une carte pour une catégorie
  Widget _buildCategoryCard(Map<String, dynamic> category) {
    final categoryName = category['name']?.toString() ?? 'Catégorie';

    return GestureDetector(
      onTap: () => _navigateToCategoryProducts(category),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: cardColor,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 3,
                  child: _buildCategoryImage(category),
                ),
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          categoryName,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            color: textColor,
                            letterSpacing: 0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (category['description'] != null && category['description'].toString().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              category['description'].toString(),
                              style: TextStyle(
                                fontSize: 12,
                                color: secondaryTextColor,
                                letterSpacing: 0.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Construit l'image de la catégorie
  Widget _buildCategoryImage(Map<String, dynamic> category) {
    final imageUrl = category['image']?.toString();
    final categoryName = category['name']?.toString() ?? 'Catégorie';

    if (imageUrl == null || imageUrl.isEmpty) {
      return Container(
        color: Colors.grey[100],
        child: Center(
          child: Icon(
            _getCategoryIcon(categoryName),
            size: 40,
            color: secondaryColor,
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Image.network(
          imageUrl,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(secondaryColor),
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                        loadingProgress.expectedTotalBytes!
                    : null,
              ),
            );
          },
          errorBuilder: (context, error, stackTrace) {
            return Container(
              color: Colors.grey[100],
              child: Center(
                child: Icon(
                  _getCategoryIcon(categoryName),
                  size: 40,
                  color: secondaryColor,
                ),
              ),
            );
          },
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [
                Colors.black.withOpacity(0.2),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Navigue vers la page des produits de la catégorie
  void _navigateToCategoryProducts(Map<String, dynamic> category) {
    if (category['_id'] == null || category['name'] == null) {
      _showErrorSnackbar('Catégorie invalide');
      return;
    }

    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => SalonProductsPage(
          salonId: widget.salonId,
          categoryId: category['_id'].toString(),
          categoryName: category['name'].toString(),
        ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOut;
          var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          return SlideTransition(
            position: animation.drive(tween),
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    // Nettoyage des ressources
    super.dispose();
  }
}