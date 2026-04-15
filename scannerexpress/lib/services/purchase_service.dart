import 'dart:async';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'trial_service.dart';

const _kProductId = 'scannerexpress_premium';

class PurchaseService {
  static final InAppPurchase _iap = InAppPurchase.instance;
  static StreamSubscription<List<PurchaseDetails>>? _subscription;

  static Future<bool> isAvailable() => _iap.isAvailable();

  static void startListening({
    required void Function() onSuccess,
    required void Function(String error) onError,
  }) {
    _subscription = _iap.purchaseStream.listen((purchases) async {
      for (final purchase in purchases) {
        if (purchase.productID == _kProductId) {
          if (purchase.status == PurchaseStatus.purchased ||
              purchase.status == PurchaseStatus.restored) {
            await TrialService.setPremium(
              purchaseToken: purchase.verificationData.serverVerificationData,
            );
            await _iap.completePurchase(purchase);
            onSuccess();
          } else if (purchase.status == PurchaseStatus.error) {
            onError(purchase.error?.message ?? 'Unknown error');
          }
        }
      }
    });
  }

  static void stopListening() => _subscription?.cancel();

  static Future<void> buyPremium() async {
    final response = await _iap.queryProductDetails({_kProductId});
    if (response.productDetails.isEmpty) {
      throw Exception('Product not found');
    }
    final purchaseParam = PurchaseParam(
      productDetails: response.productDetails.first,
    );
    await _iap.buyNonConsumable(purchaseParam: purchaseParam);
  }

  static Future<void> restorePurchases() async {
    await _iap.restorePurchases();
  }
}
