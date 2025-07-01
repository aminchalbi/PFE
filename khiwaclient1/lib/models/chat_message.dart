class ChatMessage {
  final String id;
  final String content;
  final String sender;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  ChatMessage({
    required this.content,
    required this.sender,
    required this.timestamp,
    this.metadata,
    String? id,
  }) : id = id ?? DateTime.now().millisecondsSinceEpoch.toString();

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      content: json['content'],
      sender: json['sender'],
      timestamp: DateTime.parse(json['timestamp']),
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'content': content,
        'sender': sender,
        'timestamp': timestamp.toIso8601String(),
        'metadata': metadata,
      };
}