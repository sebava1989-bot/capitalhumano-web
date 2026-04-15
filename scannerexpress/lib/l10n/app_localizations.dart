import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es')
  ];

  /// No description provided for @appName.
  ///
  /// In es, this message translates to:
  /// **'ScannerExpress'**
  String get appName;

  /// No description provided for @onboarding_scan_title.
  ///
  /// In es, this message translates to:
  /// **'Escanea'**
  String get onboarding_scan_title;

  /// No description provided for @onboarding_scan_desc.
  ///
  /// In es, this message translates to:
  /// **'Captura documentos con la cámara con detección automática de bordes.'**
  String get onboarding_scan_desc;

  /// No description provided for @onboarding_organize_title.
  ///
  /// In es, this message translates to:
  /// **'Organiza'**
  String get onboarding_organize_title;

  /// No description provided for @onboarding_organize_desc.
  ///
  /// In es, this message translates to:
  /// **'Crea carpetas y encuentra tus documentos fácilmente.'**
  String get onboarding_organize_desc;

  /// No description provided for @onboarding_share_title.
  ///
  /// In es, this message translates to:
  /// **'Comparte'**
  String get onboarding_share_title;

  /// No description provided for @onboarding_share_desc.
  ///
  /// In es, this message translates to:
  /// **'Envía PDFs por WhatsApp, email o cualquier app.'**
  String get onboarding_share_desc;

  /// No description provided for @onboarding_start.
  ///
  /// In es, this message translates to:
  /// **'Empezar gratis — 7 días'**
  String get onboarding_start;

  /// No description provided for @home_recent.
  ///
  /// In es, this message translates to:
  /// **'Recientes'**
  String get home_recent;

  /// No description provided for @home_folders.
  ///
  /// In es, this message translates to:
  /// **'Carpetas'**
  String get home_folders;

  /// No description provided for @home_scan_fab.
  ///
  /// In es, this message translates to:
  /// **'Escanear'**
  String get home_scan_fab;

  /// No description provided for @home_no_docs.
  ///
  /// In es, this message translates to:
  /// **'Aún no tienes documentos.\n¡Escanea el primero!'**
  String get home_no_docs;

  /// No description provided for @trial_days_left.
  ///
  /// In es, this message translates to:
  /// **'{days} días restantes'**
  String trial_days_left(int days);

  /// No description provided for @trial_expired.
  ///
  /// In es, this message translates to:
  /// **'Prueba expirada'**
  String get trial_expired;

  /// No description provided for @badge_pro.
  ///
  /// In es, this message translates to:
  /// **'PRO'**
  String get badge_pro;

  /// No description provided for @paywall_title.
  ///
  /// In es, this message translates to:
  /// **'Tu prueba gratuita terminó'**
  String get paywall_title;

  /// No description provided for @paywall_benefit_1.
  ///
  /// In es, this message translates to:
  /// **'Escaneos ilimitados'**
  String get paywall_benefit_1;

  /// No description provided for @paywall_benefit_2.
  ///
  /// In es, this message translates to:
  /// **'Cloud sync'**
  String get paywall_benefit_2;

  /// No description provided for @paywall_benefit_3.
  ///
  /// In es, this message translates to:
  /// **'OCR'**
  String get paywall_benefit_3;

  /// No description provided for @paywall_benefit_4.
  ///
  /// In es, this message translates to:
  /// **'Sin suscripciones'**
  String get paywall_benefit_4;

  /// No description provided for @paywall_price.
  ///
  /// In es, this message translates to:
  /// **'Pago único para siempre'**
  String get paywall_price;

  /// No description provided for @paywall_cta.
  ///
  /// In es, this message translates to:
  /// **'Desbloquear ahora — \$2'**
  String get paywall_cta;

  /// No description provided for @paywall_restore.
  ///
  /// In es, this message translates to:
  /// **'Restaurar compra'**
  String get paywall_restore;

  /// No description provided for @purchase_success_title.
  ///
  /// In es, this message translates to:
  /// **'¡ScannerExpress desbloqueado para siempre!'**
  String get purchase_success_title;

  /// No description provided for @purchase_success_continue.
  ///
  /// In es, this message translates to:
  /// **'Continuar'**
  String get purchase_success_continue;

  /// No description provided for @doc_rename.
  ///
  /// In es, this message translates to:
  /// **'Renombrar'**
  String get doc_rename;

  /// No description provided for @doc_share.
  ///
  /// In es, this message translates to:
  /// **'Compartir'**
  String get doc_share;

  /// No description provided for @doc_move.
  ///
  /// In es, this message translates to:
  /// **'Mover a carpeta'**
  String get doc_move;

  /// No description provided for @doc_delete.
  ///
  /// In es, this message translates to:
  /// **'Eliminar'**
  String get doc_delete;

  /// No description provided for @doc_ocr_tab.
  ///
  /// In es, this message translates to:
  /// **'Texto OCR'**
  String get doc_ocr_tab;

  /// No description provided for @doc_ocr_empty.
  ///
  /// In es, this message translates to:
  /// **'No se encontró texto en este documento.'**
  String get doc_ocr_empty;

  /// No description provided for @folders_new.
  ///
  /// In es, this message translates to:
  /// **'Nueva carpeta'**
  String get folders_new;

  /// No description provided for @folders_rename.
  ///
  /// In es, this message translates to:
  /// **'Renombrar carpeta'**
  String get folders_rename;

  /// No description provided for @folders_delete.
  ///
  /// In es, this message translates to:
  /// **'Eliminar carpeta'**
  String get folders_delete;

  /// No description provided for @folders_confirm_delete.
  ///
  /// In es, this message translates to:
  /// **'¿Eliminar esta carpeta? Los documentos no serán eliminados.'**
  String get folders_confirm_delete;

  /// No description provided for @settings_title.
  ///
  /// In es, this message translates to:
  /// **'Ajustes'**
  String get settings_title;

  /// No description provided for @settings_quality.
  ///
  /// In es, this message translates to:
  /// **'Calidad de escaneo'**
  String get settings_quality;

  /// No description provided for @settings_quality_normal.
  ///
  /// In es, this message translates to:
  /// **'Normal'**
  String get settings_quality_normal;

  /// No description provided for @settings_quality_high.
  ///
  /// In es, this message translates to:
  /// **'Alta'**
  String get settings_quality_high;

  /// No description provided for @settings_sync.
  ///
  /// In es, this message translates to:
  /// **'Sincronización en la nube'**
  String get settings_sync;

  /// No description provided for @settings_restore.
  ///
  /// In es, this message translates to:
  /// **'Restaurar compra'**
  String get settings_restore;

  /// No description provided for @settings_version.
  ///
  /// In es, this message translates to:
  /// **'Versión'**
  String get settings_version;

  /// No description provided for @settings_developer.
  ///
  /// In es, this message translates to:
  /// **'Desarrollado por Tu Amigo Digital SpA'**
  String get settings_developer;

  /// No description provided for @error_scanner.
  ///
  /// In es, this message translates to:
  /// **'Error al abrir el escáner. Intenta de nuevo.'**
  String get error_scanner;

  /// No description provided for @error_purchase.
  ///
  /// In es, this message translates to:
  /// **'Error al procesar el pago. Intenta de nuevo.'**
  String get error_purchase;

  /// No description provided for @error_restore_not_found.
  ///
  /// In es, this message translates to:
  /// **'No se encontró ninguna compra previa.'**
  String get error_restore_not_found;

  /// No description provided for @footer_developer.
  ///
  /// In es, this message translates to:
  /// **'Desarrollado por Tu Amigo Digital SpA'**
  String get footer_developer;

  /// No description provided for @nav_home.
  ///
  /// In es, this message translates to:
  /// **'Inicio'**
  String get nav_home;

  /// No description provided for @nav_folders.
  ///
  /// In es, this message translates to:
  /// **'Carpetas'**
  String get nav_folders;

  /// No description provided for @nav_settings.
  ///
  /// In es, this message translates to:
  /// **'Ajustes'**
  String get nav_settings;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
