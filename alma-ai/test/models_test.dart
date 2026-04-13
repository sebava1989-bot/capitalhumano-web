import 'package:flutter_test/flutter_test.dart';
import 'package:alma_ai/models/user_profile.dart';
import 'package:alma_ai/models/alma_message.dart';
import 'package:alma_ai/models/diary_entry.dart';

void main() {
  group('UserProfile', () {
    test('fromJson / toJson roundtrip', () {
      final json = {
        'name': 'Sebas',
        'almaName': 'Alma',
        'almaGender': 'female',
        'themeIndex': 0,
        'importantPeople': ['mamá Rosa', 'Carlos'],
        'interests': ['camping', 'rock'],
        'interestActivities': ['camping', 'conciertos'],
        'humorStyle': 'sarcástico_cariñoso',
        'emotionalPattern': 'catastrofiza antes de resolver',
        'recentWins': ['habló con Carlos'],
        'recurringWorries': ['trabajo'],
        'instagramHandle': '@sebas',
        'spotifyConnected': false,
        'locationLat': -33.45,
        'locationLng': -70.67,
        'onboardingComplete': true,
      };
      final profile = UserProfile.fromJson(json);
      expect(profile.name, 'Sebas');
      expect(profile.almaName, 'Alma');
      expect(profile.almaGender, 'female');
      expect(profile.themeIndex, 0);
      expect(profile.importantPeople, contains('mamá Rosa'));
      expect(profile.onboardingComplete, true);
      final roundtrip = profile.toJson();
      expect(roundtrip['name'], 'Sebas');
    });

    test('almaGenderLabel retorna texto correcto', () {
      final female = UserProfile.empty().copyWith(almaGender: 'female');
      final male = UserProfile.empty().copyWith(almaGender: 'male');
      final neutral = UserProfile.empty().copyWith(almaGender: 'neutral');
      expect(female.almaGenderLabel, 'amiga');
      expect(male.almaGenderLabel, 'amigo');
      expect(neutral.almaGenderLabel, 'compañerx');
    });
  });

  group('AlmaMessage', () {
    test('fromJson / toJson roundtrip', () {
      final now = DateTime(2026, 4, 13, 10, 0);
      final json = {
        'role': 'assistant',
        'content': 'Hola, ¿cómo estás?',
        'timestamp': now.toIso8601String(),
      };
      final msg = AlmaMessage.fromJson(json);
      expect(msg.role, 'assistant');
      expect(msg.content, 'Hola, ¿cómo estás?');
      expect(msg.isAlma, true);
    });
  });

  group('DiaryEntry', () {
    test('fromJson / toJson roundtrip', () {
      final json = {
        'mood': 3,
        'text': 'Me siento mejor hoy',
        'timestamp': DateTime(2026, 4, 13).toIso8601String(),
      };
      final entry = DiaryEntry.fromJson(json);
      expect(entry.mood, 3);
      expect(entry.text, 'Me siento mejor hoy');
    });
  });
}
