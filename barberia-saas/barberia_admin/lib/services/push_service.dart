import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final _localNotif = FlutterLocalNotificationsPlugin();

Future<void> initLocalNotifications() async {
  const android = AndroidInitializationSettings('@mipmap/ic_launcher');
  await _localNotif.initialize(
    const InitializationSettings(android: android),
  );
  await _localNotif
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(const AndroidNotificationChannel(
    'barberia_reservas',
    'Reservas',
    description: 'Notificaciones de nuevas reservas',
    importance: Importance.max,
  ));
}

Future<void> showLocalNotification(String title, String body) async {
  await _localNotif.show(
    DateTime.now().millisecondsSinceEpoch ~/ 1000,
    title,
    body,
    const NotificationDetails(
      android: AndroidNotificationDetails(
        'barberia_reservas',
        'Reservas',
        importance: Importance.max,
        priority: Priority.high,
      ),
    ),
  );
}

class PushService {
  final _fcm = FirebaseMessaging.instance;

  Future<void> init() async {
    await _fcm.requestPermission(alert: true, badge: true, sound: true);

    FirebaseMessaging.onMessage.listen((msg) {
      final title = msg.notification?.title ?? 'Barbería Admin';
      final body = msg.notification?.body ?? '';
      showLocalNotification(title, body);
    });

    final token = await _fcm.getToken();
    if (token != null) await _guardarToken(token);
    _fcm.onTokenRefresh.listen(_guardarToken);
  }

  Future<void> _guardarToken(String token) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final profile = await Supabase.instance.client
        .from('users')
        .select('barberia_id')
        .eq('id', user.id)
        .maybeSingle();
    final barberiaId = profile?['barberia_id'] as String?;
    if (barberiaId == null) return;
    await Supabase.instance.client
        .from('barberias')
        .update({'fcm_token_admin': token}).eq('id', barberiaId);
  }
}
