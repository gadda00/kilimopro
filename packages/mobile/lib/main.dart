/**
 * KilimoPRO — Flutter App Entry Point
 * Offline-first agricultural intelligence app for Kenyan farmers
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/cache_service.dart';
import 'services/notification_service.dart';
import 'screens/home_screen.dart';
import 'screens/disease_detection_screen.dart';
import 'screens/market_screen.dart';
import 'screens/weather_screen.dart';
import 'screens/advisory_screen.dart';
import 'screens/farm_screen.dart';
import 'screens/chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  final cacheService = CacheService();
  await cacheService.initialize();
  
  final notificationService = NotificationService();
  await notificationService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ApiService()),
        Provider<CacheService>.value(value: cacheService),
        Provider<NotificationService>.value(value: notificationService),
      ],
      child: KilimoPROApp(),
    ),
  );
}

class KilimoPROApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KilimoPRO',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: Color(0xFF1A6B4C),
        colorScheme: ColorScheme.fromSeed(
          seedColor: Color(0xFF1A6B4C),
          primary: Color(0xFF1A6B4C),
          secondary: Color(0xFF2484B3),
        ),
        fontFamily: 'Inter',
        appBarTheme: AppBarTheme(
          backgroundColor: Color(0xFF1A6B4C),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        cardTheme: CardTheme(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      home: MainNavigation(),
      routes: {
        '/disease': (context) => DiseaseDetectionScreen(),
        '/market': (context) => MarketScreen(),
        '/weather': (context) => WeatherScreen(),
        '/advisory': (context) => AdvisoryScreen(),
        '/farm': (context) => FarmScreen(),
        '/chat': (context) => ChatScreen(),
      },
    );
  }
}

class MainNavigation extends StatefulWidget {
  @override
  _MainNavigationState createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  
  final screens = [
    HomeScreen(),
    WeatherScreen(),
    DiseaseDetectionScreen(),
    MarketScreen(),
    ChatScreen(),
  ];
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Color(0xFF1A6B4C),
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.wb_sunny), label: 'Weather'),
          BottomNavigationBarItem(icon: Icon(Icons.camera_alt), label: 'Scan'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up), label: 'Market'),
          BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'Ask'),
        ],
      ),
    );
  }
}
