import 'package:flutter/material.dart';
import 'RatingWidget.dart';

class ReviewDialog extends StatefulWidget {
  final int initialRating;
  final String? initialComment;
  final Function(int rating, String? comment) onSubmit;

  const ReviewDialog({
    super.key,
    this.initialRating = 0,
    this.initialComment,
    required this.onSubmit,
  });

  @override
  _ReviewDialogState createState() => _ReviewDialogState();
}

class _ReviewDialogState extends State<ReviewDialog> {
  late int _rating;
  late TextEditingController _commentController;

  @override
  void initState() {
    super.initState();
    _rating = widget.initialRating;
    _commentController = TextEditingController(text: widget.initialComment);
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Donnez votre avis'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Notez ce produit:'),
            const SizedBox(height: 16),
            RatingWidget(
              initialRating: _rating,
              onRatingChanged: (rating) {
                setState(() {
                  _rating = rating;
                });
              },
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _commentController,
              decoration: const InputDecoration(
                labelText: 'Commentaire (optionnel)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_rating > 0) {
              widget.onSubmit(_rating, _commentController.text.isNotEmpty 
                  ? _commentController.text 
                  : null);
              Navigator.pop(context);
            }
          },
          child: const Text('Envoyer'),
        ),
      ],
    );
  }
}