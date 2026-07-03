/**
 * KilimoPRO API Service
 * Handles all HTTP communication with the KilimoPRO backend
 * Offline-first: all requests try cache first, then network
 */

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService extends ChangeNotifier {
  static const String baseUrl = 'https://api.kilimo.pro';
  
  String? _authToken;
  bool _isOnline = true;
  
  String? get authToken => _authToken;
  bool get isOnline => _isOnline;
  
  void setAuthToken(String token) {
    _authToken = token;
    _saveToken(token);
  }
  
  Future<Map<String, dynamic>> getWeatherForecast(double lat, double lon) async {
    return _get('/api/weather/forecast?lat=$lat&lon=$lon', cacheKey: 'weather_$lat$lon', cacheDuration: Duration(hours: 1));
  }
  
  Future<List<dynamic>> getWeatherAlerts(double lat, double lon) async {
    final data = await _get('/api/weather/alerts?lat=$lat&lon=$lon', cacheKey: 'alerts_$lat$lon', cacheDuration: Duration(hours: 1));
    return data['alerts'] ?? [];
  }
  
  Future<List<dynamic>> getMarketPrices(String commodity, {String? county}) async {
    final countyParam = county != null ? '&county=$county' : '';
    final data = await _get('/api/market/prices?commodity=$commodity$countyParam', cacheKey: 'market_$commodity', cacheDuration: Duration(hours: 6));
    return data['prices'] ?? [];
  }
  
  Future<Map<String, dynamic>> detectDisease(String imagePath, {String? userId, String? cropType}) async {
    return _post('/api/disease/detect', {
      'userId': userId, 'imagePath': imagePath, 'cropType': cropType,
    });
  }
  
  Future<Map<String, dynamic>> getAdvisory(String userId) async {
    return _get('/api/advisory/$userId', cacheKey: 'advisory_$userId', cacheDuration: Duration(hours: 3));
  }
  
  Future<Map<String, dynamic>> getDailyReport(String userId) async {
    return _get('/api/advisory/daily/$userId', cacheKey: 'daily_$userId', cacheDuration: Duration(hours: 6));
  }
  
  Future<Map<String, dynamic>> register(String phone, {String? name, String? county}) async {
    final data = await _post('/api/auth/register', {
      'phone': phone, 'name': name, 'county': county, 'language': 'sw',
    });
    if (data['token'] != null) setAuthToken(data['token']);
    return data;
  }
  
  // ─── Private helpers ─────────────────────────────────────────────
  
  Future<Map<String, dynamic>> _get(String endpoint, {String? cacheKey, Duration? cacheDuration}) async {
    if (cacheKey != null) {
      final cached = await _getCache(cacheKey);
      if (cached != null) {
        _refreshCache(endpoint, cacheKey, cacheDuration ?? Duration(hours: 1));
        return cached;
      }
    }
    try {
      final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: _headers()).timeout(Duration(seconds: 10));
      _isOnline = true;
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (cacheKey != null) await _setCache(cacheKey, data, cacheDuration ?? Duration(hours: 1));
        return data;
      }
      throw Exception('API error: ${response.statusCode}');
    } catch (e) {
      _isOnline = false;
      if (cacheKey != null) {
        final cached = await _getCache(cacheKey);
        if (cached != null) return cached;
      }
      rethrow;
    }
  }
  
  Future<Map<String, dynamic>> _post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(Uri.parse('$baseUrl$endpoint'), headers: _headers(), body: json.encode(body)).timeout(Duration(seconds: 15));
      _isOnline = true;
      return json.decode(response.body);
    } catch (e) {
      _isOnline = false;
      throw Exception('Network error: $e');
    }
  }
  
  Future<void> _refreshCache(String endpoint, String cacheKey, Duration duration) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl$endpoint'), headers: _headers()).timeout(Duration(seconds: 5));
      if (response.statusCode == 200) {
        await _setCache(cacheKey, json.decode(response.body), duration);
      }
    } catch (_) {}
  }
  
  Map<String, String> _headers() {
    final headers = {'Content-Type': 'application/json'};
    if (_authToken != null) headers['Authorization'] = 'Bearer $_authToken';
    return headers;
  }
  
  Future<Map<String, dynamic>?> _getCache(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString('cache_$key');
    if (cached == null) return null;
    final data = json.decode(cached);
    final expiresAt = data['_expiresAt'] as int?;
    if (expiresAt != null && DateTime.now().millisecondsSinceEpoch > expiresAt) return null;
    return data;
  }
  
  Future<void> _setCache(String key, Map<String, dynamic> data, Duration duration) async {
    final prefs = await SharedPreferences.getInstance();
    data['_expiresAt'] = DateTime.now().add(duration).millisecondsSinceEpoch;
    await prefs.setString('cache_$key', json.encode(data));
  }
  
  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }
}
