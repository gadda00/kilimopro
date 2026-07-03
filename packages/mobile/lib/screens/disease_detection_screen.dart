/**
 * Disease_detection Screen — KilimoPRO
 */
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class Disease_detectionScreen extends StatefulWidget {
  @override
  _Disease_detectionScreenState createState() => _Disease_detectionScreenState();
}

class _Disease_detectionScreenState extends State<Disease_detectionScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Disease_detection')),
      body: Center(
        child: Text('Disease_detection screen — coming soon'),
      ),
    );
  }
}
