import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import '../pages/profile_page.dart';
import '../pages/SearchSalonPage.dart';
import '../pages/CartPage.dart';
import '../pages/order_history.dart';
import 'package:flutter/foundation.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  final PageController _pageController = PageController();
  final List<Widget> _pages = [
    const _ChatbaseIntegration(),
    const SearchSalonPage(),
    const CartPage(),
    const OrderHistoryPage(),
    const ProfilePage(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    _pageController.jumpToPage(index);
  }

  @override
  void initState() {
    super.initState();
    _pageController.addListener(_handlePageChange);
  }

  @override
  void dispose() {
    _pageController.removeListener(_handlePageChange);
    _pageController.dispose();
    super.dispose();
  }

  void _handlePageChange() {
    final newIndex = _pageController.page?.round() ?? 0;
    if (newIndex != _selectedIndex) {
      setState(() {
        _selectedIndex = newIndex;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Empêche le retour physique vers l'écran de login/welcome
        if (_selectedIndex != 0) {
          _pageController.jumpToPage(0);
          return false;
        }
        return false;
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            _getAppBarTitle(),
            style: const TextStyle(color: Colors.white),
          ),
          backgroundColor: Colors.lightBlue[700],
          automaticallyImplyLeading: false,
          actions: _selectedIndex == 0 
              ? [
                  IconButton(
                    icon: const Icon(Icons.help_outline, color: Colors.white),
                    onPressed: () => _showHelpDialog(context),
                  ),
                ]
              : null,
        ),
        body: PageView(
          controller: _pageController,
          physics: const NeverScrollableScrollPhysics(), // Désactive le swipe
          children: _pages,
        ),
        bottomNavigationBar: _buildBottomNavBar(),
      ),
    );
  }

  String _getAppBarTitle() {
    switch (_selectedIndex) {
      case 1: return 'Rechercher un salon';
      case 2: return 'Mon panier';
      case 3: return 'Historique';
      case 4: return 'Mon profil';
      default: return 'Assistant 9hiwa';
    }
  }

  Widget _buildBottomNavBar() {
    return BottomNavigationBar(
      currentIndex: _selectedIndex,
      onTap: _onItemTapped,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Colors.lightBlue[700],
      unselectedItemColor: Colors.grey[600],
      selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500),
      items: const [
     BottomNavigationBarItem(
  icon: Icon(Icons.smart_toy_outlined), // Icône de robot (chatbot)
  activeIcon: Icon(Icons.smart_toy),    // Icône pleine pour état actif
  label: 'Assistant',
),

        BottomNavigationBarItem(
          icon: Icon(Icons.search_outlined),
          activeIcon: Icon(Icons.search),
          label: 'Rechercher',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_cart_outlined),
          activeIcon: Icon(Icons.shopping_cart),
          label: 'Panier',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.history_outlined),
          activeIcon: Icon(Icons.history),
          label: 'Historique',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outlined),
          activeIcon: Icon(Icons.person),
          label: 'Profil',
        ),
      ],
    );
  }

  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Aide', style: TextStyle(color: Colors.lightBlue)),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Comment utiliser notre assistant:',
                style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('• Posez des questions sur nos produits'),
            Text('• Demandez des recommandations'),
            Text('• Consultez nos promotions'),
            SizedBox(height: 16),
            Text('Exemples:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('"Que recommandez-vous après le sport?"'),
            Text('"Quels sont vos thés relaxants?"'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Compris', 
                style: TextStyle(color: Colors.lightBlue)),
          ),
        ],
      ),
    );
  }
}

class _ChatbaseIntegration extends StatefulWidget {
  const _ChatbaseIntegration();

  @override
  _ChatbaseIntegrationState createState() => _ChatbaseIntegrationState();
}

class _ChatbaseIntegrationState extends State<_ChatbaseIntegration> {
  late InAppWebViewController _webViewController;
  bool _isLoading = true;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Column(
          children: [
            _buildCustomHeader(),
            Expanded(
              child: InAppWebView(
                initialUrlRequest: URLRequest(url: WebUri('about:blank')),
                onWebViewCreated: (controller) {
                  _webViewController = controller;
                  _initCustomChat();
                },
                onLoadStop: (_, __) => setState(() => _isLoading = false),
                initialSettings: InAppWebViewSettings(
                  transparentBackground: true,
                  disableVerticalScroll: true,
                  disableHorizontalScroll: true,
                  disableContextMenu: false,
                  supportZoom: false,
                  javaScriptEnabled: true,
                  javaScriptCanOpenWindowsAutomatically: true,
                  mediaPlaybackRequiresUserGesture: false,
                ),
              ),
            ),
          ],
        ),
        if (_isLoading) _buildCustomLoader(),
      ],
    );
  }

  Widget _buildCustomHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.lightBlue[50],
        border: Border(
          bottom: BorderSide(color: Colors.lightBlue[100]!, width: 1),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.lightBlue[100],
            child: const Icon(Icons.smart_toy, color: Colors.lightBlue),
          ),
          const SizedBox(width: 12),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Assistant 9hiwa',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.lightBlue,
                ),
              ),
              Text(
                'En ligne • Prêt à vous aider',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCustomLoader() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: Colors.lightBlue),
          const SizedBox(height: 16),
          Text(
            'Chargement de l\'assistant...',
            style: TextStyle(color: Colors.lightBlue[700]),
          ),
        ],
      ),
    );
  }

  Future<void> _initCustomChat() async {
    await _webViewController.loadData(
      data: """
      <!DOCTYPE html>
      <html style="height:100%">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            background: #f5f9ff;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            box-shadow: none;
          }
          /* Cache tous les éléments indésirables */
          .chatbase-pdf-container, .chatbase-watermark {
            display: none !important;
          }
          /* Amélioration du champ de saisie */
          input, textarea {
            -webkit-user-select: auto !important;
            -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
          }
        </style>
      </head>
      <body>
        <iframe 
          src="https://www.chatbase.co/chatbot-iframe/27Kf5efV1snUrscdVVVyy?hideHeader=true&hidePdf=true"
          allow="autoplay; microphone"
          allowfullscreen
        ></iframe>
        <script>
          // Script pour améliorer la compatibilité tactile
          document.addEventListener('DOMContentLoaded', function() {
            // Masquer les éléments indésirables
            const style = document.createElement('style');
            style.innerHTML = `
              .chatbase-pdf-container, 
              .chatbase-watermark,
              .pdf-preview-header {
                display: none !important;
              }
            `;
            document.head.appendChild(style);
            
            // Forcer le focus sur le champ de saisie
            setTimeout(function() {
              const iframe = document.querySelector('iframe');
              if (iframe) {
                iframe.addEventListener('load', function() {
                  const input = iframe.contentWindow.document.querySelector('input, textarea');
                  if (input) {
                    input.focus({preventScroll: true});
                  }
                });
              }
            }, 2000);
          });
        </script>
      </body>
      </html>
      """,
      mimeType: 'text/html',
      encoding: 'utf-8',
    );
  }
}