/**
 * Home Screen — Personalized farm dashboard
 * Shows: weather summary, alerts, today's tasks, market snapshot
 */
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _dailyReport;
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    // In production, use real userId from auth
    final api = Provider.of<ApiService>(context, listen: false);
    try {
      final report = await api.getDailyReport('demo_user');
      setState(() {
        _dailyReport = report;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('KilimoPRO', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: Icon(Icons.notifications), onPressed: () {}),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: EdgeInsets.all(16),
                children: [
                  // Weather card
                  _buildWeatherCard(),
                  SizedBox(height: 16),
                  // Alerts
                  if (_dailyReport?['alerts']?.isNotEmpty ?? false) ...[
                    _buildAlertsCard(),
                    SizedBox(height: 16),
                  ],
                  // Today's tasks
                  _buildTasksCard(),
                  SizedBox(height: 16),
                  // Market snapshot
                  _buildMarketCard(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/disease'),
        icon: Icon(Icons.camera_alt),
        label: Text('Scan Crop'),
        backgroundColor: Theme.of(context).primaryColor,
      ),
    );
  }
  
  Widget _buildWeatherCard() {
    final weather = _dailyReport?['weather'] ?? {};
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Today\'s Weather', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Icon(_weatherIcon(weather['summary'] ?? ''), size: 32, color: Colors.amber),
              ],
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _weatherInfo('Temp', weather['temp'] ?? 'N/A'),
                _weatherInfo('Rain', weather['rain'] ?? 'N/A'),
                _weatherInfo('Condition', weather['summary'] ?? 'N/A'),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildAlertsCard() {
    final alerts = _dailyReport?['alerts'] as List;
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: Colors.red),
                SizedBox(width: 8),
                Text('Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red)),
              ],
            ),
            SizedBox(height: 8),
            ...alerts.map((alert) => Padding(
              padding: EdgeInsets.only(bottom: 4),
              child: Text('• $alert', style: TextStyle(fontSize: 14)),
            )),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTasksCard() {
    final tasks = _dailyReport?['tasks'] as List? ?? [];
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Today\'s Tasks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            if (tasks.isEmpty)
              Text('No tasks for today. Good time to rest! 😊', style: TextStyle(color: Colors.grey))
            else
              ...tasks.map((task) => CheckboxListTile(
                title: Text(task, style: TextStyle(fontSize: 14)),
                value: false,
                onChanged: (_) {},
                dense: true,
              )),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMarketCard() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Market Prices', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/market'),
                  child: Text('See all'),
                ),
              ],
            ),
            SizedBox(height: 8),
            _marketRow('Maize', 'KES 3,500/bag', '↑ 2%'),
            _marketRow('Beans', 'KES 7,500/bag', '↓ 1%'),
            _marketRow('Potato', 'KES 2,200/bag', '↑ 5%'),
          ],
        ),
      ),
    );
  }
  
  Widget _weatherInfo(String label, String value) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
  
  Widget _marketRow(String commodity, String price, String change) {
    final isUp = change.contains('↑');
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(commodity, style: TextStyle(fontSize: 14)),
          Text(price, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          Text(change, style: TextStyle(fontSize: 12, color: isUp ? Colors.green : Colors.red)),
        ],
      ),
    );
  }
  
  IconData _weatherIcon(String condition) {
    switch (condition.toLowerCase()) {
      case 'rainy': return Icons.grain;
      case 'hot': return Icons.wb_sunny;
      default: return Icons.wb_cloudy;
    }
  }
}
