class UserProfile {
  final String name;
  final String almaName;
  final String almaGender; // 'female' | 'male' | 'neutral'
  final int themeIndex;
  final List<String> importantPeople;
  final List<String> interests;
  final List<String> interestActivities;
  final String humorStyle;
  final String emotionalPattern;
  final List<String> recentWins;
  final List<String> recurringWorries;
  final String instagramHandle;
  final bool spotifyConnected;
  final double? locationLat;
  final double? locationLng;
  final bool onboardingComplete;

  const UserProfile({
    required this.name,
    required this.almaName,
    required this.almaGender,
    required this.themeIndex,
    required this.importantPeople,
    required this.interests,
    required this.interestActivities,
    required this.humorStyle,
    required this.emotionalPattern,
    required this.recentWins,
    required this.recurringWorries,
    required this.instagramHandle,
    required this.spotifyConnected,
    this.locationLat,
    this.locationLng,
    required this.onboardingComplete,
  });

  factory UserProfile.empty() => const UserProfile(
        name: '',
        almaName: 'Alma',
        almaGender: 'female',
        themeIndex: 0,
        importantPeople: [],
        interests: [],
        interestActivities: [],
        humorStyle: '',
        emotionalPattern: '',
        recentWins: [],
        recurringWorries: [],
        instagramHandle: '',
        spotifyConnected: false,
        onboardingComplete: false,
      );

  String get almaGenderLabel {
    switch (almaGender) {
      case 'female':
        return 'amiga';
      case 'male':
        return 'amigo';
      default:
        return 'compañerx';
    }
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        name: json['name'] as String? ?? '',
        almaName: json['almaName'] as String? ?? 'Alma',
        almaGender: json['almaGender'] as String? ?? 'female',
        themeIndex: json['themeIndex'] as int? ?? 0,
        importantPeople: List<String>.from(json['importantPeople'] ?? []),
        interests: List<String>.from(json['interests'] ?? []),
        interestActivities: List<String>.from(json['interestActivities'] ?? []),
        humorStyle: json['humorStyle'] as String? ?? '',
        emotionalPattern: json['emotionalPattern'] as String? ?? '',
        recentWins: List<String>.from(json['recentWins'] ?? []),
        recurringWorries: List<String>.from(json['recurringWorries'] ?? []),
        instagramHandle: json['instagramHandle'] as String? ?? '',
        spotifyConnected: json['spotifyConnected'] as bool? ?? false,
        locationLat: (json['locationLat'] as num?)?.toDouble(),
        locationLng: (json['locationLng'] as num?)?.toDouble(),
        onboardingComplete: json['onboardingComplete'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'almaName': almaName,
        'almaGender': almaGender,
        'themeIndex': themeIndex,
        'importantPeople': importantPeople,
        'interests': interests,
        'interestActivities': interestActivities,
        'humorStyle': humorStyle,
        'emotionalPattern': emotionalPattern,
        'recentWins': recentWins,
        'recurringWorries': recurringWorries,
        'instagramHandle': instagramHandle,
        'spotifyConnected': spotifyConnected,
        'locationLat': locationLat,
        'locationLng': locationLng,
        'onboardingComplete': onboardingComplete,
      };

  UserProfile copyWith({
    String? name,
    String? almaName,
    String? almaGender,
    int? themeIndex,
    List<String>? importantPeople,
    List<String>? interests,
    List<String>? interestActivities,
    String? humorStyle,
    String? emotionalPattern,
    List<String>? recentWins,
    List<String>? recurringWorries,
    String? instagramHandle,
    bool? spotifyConnected,
    double? locationLat,
    double? locationLng,
    bool? onboardingComplete,
  }) =>
      UserProfile(
        name: name ?? this.name,
        almaName: almaName ?? this.almaName,
        almaGender: almaGender ?? this.almaGender,
        themeIndex: themeIndex ?? this.themeIndex,
        importantPeople: importantPeople ?? this.importantPeople,
        interests: interests ?? this.interests,
        interestActivities: interestActivities ?? this.interestActivities,
        humorStyle: humorStyle ?? this.humorStyle,
        emotionalPattern: emotionalPattern ?? this.emotionalPattern,
        recentWins: recentWins ?? this.recentWins,
        recurringWorries: recurringWorries ?? this.recurringWorries,
        instagramHandle: instagramHandle ?? this.instagramHandle,
        spotifyConnected: spotifyConnected ?? this.spotifyConnected,
        locationLat: locationLat ?? this.locationLat,
        locationLng: locationLng ?? this.locationLng,
        onboardingComplete: onboardingComplete ?? this.onboardingComplete,
      );
}
