/**
 * Advisory Screen — KilimoPRO
 */
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class AdvisoryScreen extends StatefulWidget {
  @override
  _AdvisoryScreenState createState() => _AdvisoryScreenState();
}

class _AdvisoryScreenState extends State<AdvisoryScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Advisory')),
      body: Center(
        child: Text('Advisory screen — coming soon'),
      ),
    );
  }
}
