/**
 * Cache Service — SQLite-based local cache for offline-first architecture
 */
import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class CacheService {
  Database? _db;
  
  Future<void> initialize() async {
    final dbPath = await getDatabasesPath();
    _db = await openDatabase(
      join(dbPath, 'kilimopro.db'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            expires_at INTEGER NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE pending_sync (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            body TEXT,
            created_at INTEGER NOT NULL
          )
        ''');
      },
    );
  }
  
  Future<String?> get(String key) async {
    final results = await _db?.query('cache', where: 'key = ?', whereArgs: [key]);
    if (results == null || results.isEmpty) return null;
    final expiresAt = results[0]['expires_at'] as int;
    if (DateTime.now().millisecondsSinceEpoch > expiresAt) {
      await _db?.delete('cache', where: 'key = ?', whereArgs: [key]);
      return null;
    }
    return results[0]['value'] as String;
  }
  
  Future<void> set(String key, String value, Duration duration) async {
    await _db?.insert('cache', {
      'key': key,
      'value': value,
      'expires_at': DateTime.now().add(duration).millisecondsSinceEpoch,
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }
  
  Future<void> queueSync(String endpoint, String method, {Map<String, dynamic>? body}) async {
    await _db?.insert('pending_sync', {
      'endpoint': endpoint,
      'method': method,
      'body': body != null ? json.encode(body) : null,
      'created_at': DateTime.now().millisecondsSinceEpoch,
    });
  }
  
  Future<List<Map<String, dynamic>>> getPendingSyncs() async {
    return await _db?.query('pending_sync', orderBy: 'created_at ASC') ?? [];
  }
  
  Future<void> clearSync(int id) async {
    await _db?.delete('pending_sync', where: 'id = ?', whereArgs: [id]);
  }
}
