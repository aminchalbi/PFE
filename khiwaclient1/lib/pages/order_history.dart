import 'package:flutter/material.dart';
import '../services/api_service.dart';

class OrderHistoryPage extends StatefulWidget {
  const OrderHistoryPage({super.key});

  @override
  _OrderHistoryPageState createState() => _OrderHistoryPageState();
}

class _OrderHistoryPageState extends State<OrderHistoryPage> {
  List<dynamic> orders = [];
  List<dynamic> notifications = [];
  bool isLoading = true;
  bool showNotifications = false;
  int unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    try {
      await _cleanOldData();
      final results = await Future.wait([
        ApiService.getOrderHistory(),
        ApiService.getNotifications(),
      ]);

      setState(() {
        orders = results[0] is List ? results[0] : [];
        notifications = results[1] is List ? results[1] : [];
        unreadCount = notifications.where((n) => n['read'] == false).length;
        isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: ${e.toString()}')),
        );
        setState(() => isLoading = false);
      }
    }
  }
  // Ajoutez cette méthode dans _OrderHistoryPageState
Future<void> _showCancelDialog(BuildContext context, String orderId) async {
  final reasonController = TextEditingController();
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Annuler la commande'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Veuillez indiquer la raison de l\'annulation:'),
          const SizedBox(height: 16),
          TextField(
            controller: reasonController,
            decoration: const InputDecoration(
              labelText: 'Raison',
              border: OutlineInputBorder(),
              hintText: 'Pourquoi souhaitez-vous annuler cette commande?',
            ),
            maxLines: 3,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Retour'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          onPressed: () {
            if (reasonController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Veuillez indiquer une raison')),
              );
              return;
            }
            Navigator.pop(context, true);
          },
          child: const Text('Confirmer l\'annulation'),
        ),
      ],
    ),
  );

  if (result == true) {
    try {
      setState(() => isLoading = true);
      await ApiService.cancelOrder(
        orderId: orderId,
        reason: reasonController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Commande annulée avec succès'),
            backgroundColor: Colors.green,
          ),
        );
        await _loadData(); // Recharger les données
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => isLoading = false);
      }
    }
  }
}


  Future<void> _cleanOldData() async {
    try {
      await ApiService.cleanOldOrders();
      await ApiService.cleanOldNotifications();
    } catch (e) {
      debugPrint('Erreur nettoyage: $e');
    }
  }

 Widget _buildOrderItem(dynamic order) {
  String firstProductName = (order['products'] != null && order['products'].isNotEmpty) 
      ? (order['products'][0]['product']?['name'] ?? 'Commande')
      : 'Commande';

  bool isPending = order['status'] == 'pending';
  bool isCancelled = order['isCancelled'] == true;

  return Card(
    margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
    elevation: 2,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    child: ExpansionTile(
      leading: Icon(Icons.shopping_bag, color: Theme.of(context).primaryColor),
      title: Text(firstProductName, style: TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${_formatDate(order['createdAt'])}'),
          Text('${order['total']?.toStringAsFixed(2) ?? '0.00'} Dt',
              style: TextStyle(color: Colors.green)),
        ],
      ),
      trailing: isCancelled 
          ? Chip(
              avatar: Icon(Icons.cancel, size: 18, color: Colors.white),
              label: const Text(
                'Annulée',
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
              backgroundColor: Colors.red,
            )
          : _buildStatusBadge(order['status']),
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.store, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text('Salon: ${order['salon']?['name'] ?? 'Inconnu'}'),
                ],
              ),
              const SizedBox(height: 12),
              if (isCancelled) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.info, size: 16, color: Colors.red),
                    const SizedBox(width: 8),
                    Text(
                      'Commande annulée',
                      style: TextStyle(color: Colors.red),
                    ),
                  ],
                ),
                if (order['cancellationReason'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Raison: ${order['cancellationReason']}',
                    style: TextStyle(fontStyle: FontStyle.italic),
                  ),
                ],
                const SizedBox(height: 12),
              ],
              const Text('Produits:', style: TextStyle(fontWeight: FontWeight.bold)),
              ...order['products'].map<Widget>((item) {
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: item['product']?['image'] != null 
                      ? CircleAvatar(
                          backgroundImage: NetworkImage('http://192.168.1.12:3000${item['product']['image']}'),
                        )
                      : const CircleAvatar(child: Icon(Icons.fastfood)),
                  title: Text(item['product']?['name'] ?? 'Produit inconnu'),
                  subtitle: Text('${item['product']?['price'] ?? '0.00'} Dt'),
                  trailing: Text('x${item['quantity']}'),
                );
              }).toList(),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('TOTAL:', style: TextStyle(fontWeight: FontWeight.bold)),
                  Text('${order['total']?.toStringAsFixed(2) ?? '0.00'} Dt',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Theme.of(context).primaryColor,
                      )),
                ],
              ),
              const SizedBox(height: 8),
              if (isPending && !isCancelled) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade100,
                      foregroundColor: Colors.red,
                    ),
                    onPressed: () => _showCancelDialog(context, order['_id']),
                    child: const Text('Annuler la commande'),
                  ),
                ),
              ],
              const SizedBox(height: 8),
              const Text(
                '⚠️ Suppression automatique après 72 heures',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

  Widget _buildStatusBadge(String? status) {
    final Map<String, dynamic> statusData = {
      'pending': {'color': Colors.orange, 'icon': Icons.pending_actions},
      'preparing': {'color': Colors.blue, 'icon': Icons.restaurant},
      'ready': {'color': Colors.green, 'icon': Icons.check_circle},
      'delivered': {'color': Colors.purple, 'icon': Icons.delivery_dining},
    };

    final data = statusData[status?.toLowerCase()] ?? 
                {'color': Colors.grey, 'icon': Icons.help_outline};

    return Chip(
      avatar: Icon(data['icon'] as IconData, size: 18, color: Colors.white),
      label: Text(
        status ?? 'En attente',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
      backgroundColor: data['color'] as Color,
    );
  }

  Widget _buildNotificationItem(dynamic notification) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: notification['read'] == false ? 2 : 0,
      color: notification['read'] == false 
          ? Colors.blue.shade50 
          : Colors.grey.shade50,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: notification['read'] == false 
                ? Colors.blue.withOpacity(0.2) 
                : Colors.grey.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.notifications,
            color: notification['read'] == false 
                ? Colors.blue 
                : Colors.grey,
          ),
        ),
        title: Text(
          notification['message'] ?? 'Notification',
          style: TextStyle(
            fontWeight: notification['read'] == false 
                ? FontWeight.bold 
                : FontWeight.normal,
            color: notification['read'] == false 
                ? Colors.blue.shade900 
                : Colors.grey.shade800,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _formatDate(notification['createdAt']),
              style: TextStyle(
                color: notification['read'] == false 
                    ? Colors.blue.shade600 
                    : Colors.grey,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Suppression automatique après 72 heures',
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
        trailing: notification['read'] == false 
            ? const Icon(Icons.brightness_1, size: 12, color: Colors.red)
            : null,
        onTap: () {
          if (notification['read'] == false) {
            setState(() {
              notification['read'] = true;
              unreadCount = notifications.where((n) => n['read'] == false).length;
            });
            ApiService.markNotificationsAsRead();
          }
        },
      ),
    );
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateString;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: showNotifications 
            ? const Text('Notifications')
            : const Text('Historique des Commandes'),
        automaticallyImplyLeading: false,
        leading: showNotifications
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () {
                  setState(() {
                    showNotifications = false;
                  });
                },
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications),
                onPressed: () {
                  setState(() => showNotifications = !showNotifications);
                  if (unreadCount > 0) {
                    setState(() {
                      notifications.forEach((n) => n['read'] = true);
                      unreadCount = 0;
                    });
                    ApiService.markNotificationsAsRead();
                  }
                },
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: CircleAvatar(
                    radius: 10,
                    backgroundColor: Colors.red,
                    child: Text(
                      unreadCount.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : showNotifications
              ? _buildNotificationsView()
              : _buildOrdersView(),
    );
  }

  Widget _buildOrdersView() {
    return orders.isEmpty
        ? const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.history, size: 50, color: Colors.grey),
                SizedBox(height: 16),
                Text('Aucune commande récente'),
                SizedBox(height: 8),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    'Vos commandes récentes apparaîtront ici\net seront automatiquement supprimées après 72 heures',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ),
          )
        : RefreshIndicator(
            onRefresh: _loadData,
            child: ListView.builder(
              itemCount: orders.length,
              itemBuilder: (context, index) => _buildOrderItem(orders[index]),
            ),
          );
  }

  Widget _buildNotificationsView() {
    return notifications.isEmpty
        ? const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_none, size: 50, color: Colors.grey),
                SizedBox(height: 16),
                Text('Aucune notification récente'),
                SizedBox(height: 8),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    'Vos notifications récentes apparaîtront ici\net seront automatiquement supprimées après 72 heures',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ],
            ),
          )
        : RefreshIndicator(
            onRefresh: _loadData,
            child: ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) => 
                  _buildNotificationItem(notifications[index]),
            ),
          );
  }
}