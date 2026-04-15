// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'ScannerExpress';

  @override
  String get onboarding_scan_title => 'Scan';

  @override
  String get onboarding_scan_desc =>
      'Capture documents with your camera with automatic edge detection.';

  @override
  String get onboarding_organize_title => 'Organize';

  @override
  String get onboarding_organize_desc =>
      'Create folders and find your documents easily.';

  @override
  String get onboarding_share_title => 'Share';

  @override
  String get onboarding_share_desc =>
      'Send PDFs via WhatsApp, email or any app.';

  @override
  String get onboarding_start => 'Start free — 7 days';

  @override
  String get home_recent => 'Recent';

  @override
  String get home_folders => 'Folders';

  @override
  String get home_scan_fab => 'Scan';

  @override
  String get home_no_docs => 'No documents yet.\nScan your first one!';

  @override
  String trial_days_left(int days) {
    return '$days days left';
  }

  @override
  String get trial_expired => 'Trial expired';

  @override
  String get badge_pro => 'PRO';

  @override
  String get paywall_title => 'Your free trial has ended';

  @override
  String get paywall_benefit_1 => 'Unlimited scans';

  @override
  String get paywall_benefit_2 => 'Cloud sync';

  @override
  String get paywall_benefit_3 => 'OCR';

  @override
  String get paywall_benefit_4 => 'No subscriptions';

  @override
  String get paywall_price => 'One-time payment forever';

  @override
  String get paywall_cta => 'Unlock now — \$2';

  @override
  String get paywall_restore => 'Restore purchase';

  @override
  String get purchase_success_title => 'ScannerExpress unlocked forever!';

  @override
  String get purchase_success_continue => 'Continue';

  @override
  String get doc_rename => 'Rename';

  @override
  String get doc_share => 'Share';

  @override
  String get doc_move => 'Move to folder';

  @override
  String get doc_delete => 'Delete';

  @override
  String get doc_ocr_tab => 'OCR Text';

  @override
  String get doc_ocr_empty => 'No text found in this document.';

  @override
  String get folders_new => 'New folder';

  @override
  String get folders_rename => 'Rename folder';

  @override
  String get folders_delete => 'Delete folder';

  @override
  String get folders_confirm_delete =>
      'Delete this folder? Documents will not be deleted.';

  @override
  String get settings_title => 'Settings';

  @override
  String get settings_quality => 'Scan quality';

  @override
  String get settings_quality_normal => 'Normal';

  @override
  String get settings_quality_high => 'High';

  @override
  String get settings_sync => 'Cloud synchronization';

  @override
  String get settings_restore => 'Restore purchase';

  @override
  String get settings_version => 'Version';

  @override
  String get settings_developer => 'Developed by Tu Amigo Digital SpA';

  @override
  String get error_scanner => 'Error opening scanner. Please try again.';

  @override
  String get error_purchase => 'Payment error. Please try again.';

  @override
  String get error_restore_not_found => 'No previous purchase found.';

  @override
  String get footer_developer => 'Developed by Tu Amigo Digital SpA';

  @override
  String get nav_home => 'Home';

  @override
  String get nav_folders => 'Folders';

  @override
  String get nav_settings => 'Settings';
}
