class UserState {
  final DateTime installDate;
  final bool isPremium;
  final String? purchaseToken;
  final String firebaseUid;

  UserState({
    required this.installDate,
    required this.isPremium,
    this.purchaseToken,
    required this.firebaseUid,
  });
}
