// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appName => 'ScannerExpress';

  @override
  String get onboarding_scan_title => 'Escanea';

  @override
  String get onboarding_scan_desc =>
      'Captura documentos con la cámara con detección automática de bordes.';

  @override
  String get onboarding_organize_title => 'Organiza';

  @override
  String get onboarding_organize_desc =>
      'Crea carpetas y encuentra tus documentos fácilmente.';

  @override
  String get onboarding_share_title => 'Comparte';

  @override
  String get onboarding_share_desc =>
      'Envía PDFs por WhatsApp, email o cualquier app.';

  @override
  String get onboarding_start => 'Empezar gratis — 7 días';

  @override
  String get home_recent => 'Recientes';

  @override
  String get home_folders => 'Carpetas';

  @override
  String get home_scan_fab => 'Escanear';

  @override
  String get home_no_docs => 'Aún no tienes documentos.\n¡Escanea el primero!';

  @override
  String trial_days_left(int days) {
    return '$days días restantes';
  }

  @override
  String get trial_expired => 'Prueba expirada';

  @override
  String get badge_pro => 'PRO';

  @override
  String get paywall_title => 'Tu prueba gratuita terminó';

  @override
  String get paywall_benefit_1 => 'Escaneos ilimitados';

  @override
  String get paywall_benefit_2 => 'Cloud sync';

  @override
  String get paywall_benefit_3 => 'OCR';

  @override
  String get paywall_benefit_4 => 'Sin suscripciones';

  @override
  String get paywall_price => 'Pago único para siempre';

  @override
  String get paywall_cta => 'Desbloquear ahora — \$2';

  @override
  String get paywall_restore => 'Restaurar compra';

  @override
  String get purchase_success_title =>
      '¡ScannerExpress desbloqueado para siempre!';

  @override
  String get purchase_success_continue => 'Continuar';

  @override
  String get doc_rename => 'Renombrar';

  @override
  String get doc_share => 'Compartir';

  @override
  String get doc_move => 'Mover a carpeta';

  @override
  String get doc_delete => 'Eliminar';

  @override
  String get doc_ocr_tab => 'Texto OCR';

  @override
  String get doc_ocr_empty => 'No se encontró texto en este documento.';

  @override
  String get folders_new => 'Nueva carpeta';

  @override
  String get folders_rename => 'Renombrar carpeta';

  @override
  String get folders_delete => 'Eliminar carpeta';

  @override
  String get folders_confirm_delete =>
      '¿Eliminar esta carpeta? Los documentos no serán eliminados.';

  @override
  String get settings_title => 'Ajustes';

  @override
  String get settings_quality => 'Calidad de escaneo';

  @override
  String get settings_quality_normal => 'Normal';

  @override
  String get settings_quality_high => 'Alta';

  @override
  String get settings_sync => 'Sincronización en la nube';

  @override
  String get settings_restore => 'Restaurar compra';

  @override
  String get settings_version => 'Versión';

  @override
  String get settings_developer => 'Desarrollado por Tu Amigo Digital SpA';

  @override
  String get error_scanner => 'Error al abrir el escáner. Intenta de nuevo.';

  @override
  String get error_purchase => 'Error al procesar el pago. Intenta de nuevo.';

  @override
  String get error_restore_not_found => 'No se encontró ninguna compra previa.';

  @override
  String get footer_developer => 'Desarrollado por Tu Amigo Digital SpA';

  @override
  String get nav_home => 'Inicio';

  @override
  String get nav_folders => 'Carpetas';

  @override
  String get nav_settings => 'Ajustes';
}
