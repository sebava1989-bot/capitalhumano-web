import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/food_ai_service.dart';
import '../services/nutrition_storage.dart';
import '../theme/app_theme.dart';

class NutritionScreen extends StatefulWidget {
  const NutritionScreen({super.key});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  List<MealLog> _meals = [];
  int _calorieGoal = 2000;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final meals = await NutritionStorage.getToday();
    final goal = await NutritionStorage.getCalorieGoal();
    if (mounted) setState(() { _meals = meals; _calorieGoal = goal; _loading = false; });
  }

  int get _totalCals => _meals.fold(0, (sum, m) => sum + m.analysis.calorias);
  int get _totalProt => _meals.fold(0, (sum, m) => sum + m.analysis.proteinas);
  int get _totalCarbs => _meals.fold(0, (sum, m) => sum + m.analysis.carbohidratos);
  int get _totalFats => _meals.fold(0, (sum, m) => sum + m.analysis.grasas);

  void _openCamera() {
    final now = DateTime.now();
    final hour = now.hour;
    String mealType = 'snack';
    if (hour >= 6 && hour < 11) mealType = 'desayuno';
    else if (hour >= 11 && hour < 15) mealType = 'almuerzo';
    else if (hour >= 19 && hour < 23) mealType = 'cena';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _SourcePicker(
        mealType: mealType,
        onPicked: (file, type) {
          Navigator.pop(context);
          _analyzeFood(file, type);
        },
      ),
    );
  }

  Future<void> _analyzeFood(File imageFile, String mealType) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _AnalyzingDialog(),
    );

    try {
      final analysis = await FoodAiService.analyzePhoto(imageFile);
      if (!mounted) return;
      Navigator.pop(context); // cierra analyzing dialog
      _showResultDialog(imageFile, analysis, mealType);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showResultDialog(File imageFile, FoodAnalysis analysis, String mealType) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _FoodResultSheet(
        imageFile: imageFile,
        analysis: analysis,
        mealType: mealType,
        onConfirm: (type) async {
          Navigator.pop(context);
          final meal = MealLog(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            dateTime: DateTime.now(),
            imagePath: imageFile.path,
            analysis: analysis,
            mealType: type,
          );
          await NutritionStorage.saveMeal(meal);
          _load();
        },
      ),
    );
  }

  Future<void> _deleteMeal(MealLog meal) async {
    await NutritionStorage.deleteMeal(meal.id, meal.dateTime);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_totalCals / _calorieGoal).clamp(0.0, 1.0);
    final remaining = _calorieGoal - _totalCals;

    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : CustomScrollView(
              slivers: [
                // Header
                SliverAppBar(
                  expandedHeight: 180,
                  pinned: true,
                  backgroundColor: AppTheme.secondary,
                  automaticallyImplyLeading: false,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(32),
                          bottomRight: Radius.circular(32),
                        ),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(22, 16, 22, 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('🥗 Nutrición', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                              const SizedBox(height: 4),
                              Text(_totalCals == 0 ? 'Sin registro hoy' : '$_totalCals de $_calorieGoal kcal',
                                  style: const TextStyle(color: Colors.white70, fontSize: 14)),
                              const SizedBox(height: 14),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: LinearProgressIndicator(
                                  value: progress,
                                  backgroundColor: Colors.white24,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    progress > 0.9 ? Colors.red.shade300 : Colors.greenAccent,
                                  ),
                                  minHeight: 10,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                remaining > 0 ? 'Restan $remaining kcal' : '¡Meta superada por ${-remaining} kcal!',
                                style: TextStyle(
                                  color: remaining > 0 ? Colors.white70 : Colors.red.shade200,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Macros resumen
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                    child: Row(
                      children: [
                        _MacroBox(label: 'Proteínas', value: _totalProt, unit: 'g', color: const Color(0xFF2196F3)),
                        const SizedBox(width: 10),
                        _MacroBox(label: 'Carbos', value: _totalCarbs, unit: 'g', color: const Color(0xFFFF9800)),
                        const SizedBox(width: 10),
                        _MacroBox(label: 'Grasas', value: _totalFats, unit: 'g', color: const Color(0xFFE91E63)),
                      ],
                    ),
                  ),
                ),

                // Lista de comidas
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 22, 20, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Comidas de hoy',
                            style: TextStyle(color: AppTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                        Text('${_meals.length} registros',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                      ],
                    ),
                  ),
                ),

                if (_meals.isEmpty)
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.symmetric(vertical: 50),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppTheme.divider),
                      ),
                      child: Column(
                        children: [
                          const Text('📷', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          const Text('Saca una foto a tu comida',
                              style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          const Text('La IA detecta el alimento y estima\ncalorías y macros automáticamente',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ],
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, i) => _MealCard(
                          meal: _meals[i],
                          onDelete: () => _deleteMeal(_meals[i]),
                        ),
                        childCount: _meals.length,
                      ),
                    ),
                  ),

                const SliverToBoxAdapter(child: SizedBox(height: 110)),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCamera,
        backgroundColor: const Color(0xFF2E7D32),
        icon: const Icon(Icons.camera_alt, color: Colors.white),
        label: const Text('Foto de comida', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

// ─── Subwidgets ────────────────────────────────────────────

class _MacroBox extends StatelessWidget {
  final String label;
  final int value;
  final String unit;
  final Color color;
  const _MacroBox({required this.label, required this.value, required this.unit, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Column(
          children: [
            Text('$value$unit', style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _MealCard extends StatelessWidget {
  final MealLog meal;
  final VoidCallback onDelete;
  const _MealCard({required this.meal, required this.onDelete});

  String get _typeEmoji {
    switch (meal.mealType) {
      case 'desayuno': return '🌅';
      case 'almuerzo': return '☀️';
      case 'cena': return '🌙';
      default: return '🍎';
    }
  }

  String get _typeLabel {
    switch (meal.mealType) {
      case 'desayuno': return 'Desayuno';
      case 'almuerzo': return 'Almuerzo';
      case 'cena': return 'Cena';
      default: return 'Snack';
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasImage = meal.imagePath.isNotEmpty && File(meal.imagePath).existsSync();

    return Dismissible(
      key: Key(meal.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.red.withOpacity(0.2),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete_outline, color: Colors.red),
      ),
      onDismissed: (_) => onDelete(),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.divider),
        ),
        child: Row(
          children: [
            // Imagen o placeholder
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                bottomLeft: Radius.circular(16),
              ),
              child: hasImage
                  ? Image.file(File(meal.imagePath), width: 80, height: 80, fit: BoxFit.cover)
                  : Container(
                      width: 80, height: 80,
                      color: AppTheme.secondary,
                      child: const Center(child: Text('🍽️', style: TextStyle(fontSize: 30))),
                    ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('$_typeEmoji $_typeLabel',
                            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
                        const Spacer(),
                        Text(
                          '${meal.dateTime.hour}:${meal.dateTime.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(meal.analysis.nombre,
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w700),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _Pill('${meal.analysis.calorias} kcal', const Color(0xFF2E7D32)),
                        const SizedBox(width: 6),
                        _Pill('P: ${meal.analysis.proteinas}g', const Color(0xFF1565C0)),
                        const SizedBox(width: 6),
                        _Pill('C: ${meal.analysis.carbohidratos}g', const Color(0xFFE65100)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final Color color;
  const _Pill(this.text, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
    );
  }
}

class _SourcePicker extends StatefulWidget {
  final String mealType;
  final Function(File, String) onPicked;
  const _SourcePicker({required this.mealType, required this.onPicked});

  @override
  State<_SourcePicker> createState() => _SourcePickerState();
}

class _SourcePickerState extends State<_SourcePicker> {
  late String _mealType;

  @override
  void initState() {
    super.initState();
    _mealType = widget.mealType;
  }

  Future<void> _pick(ImageSource source) async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: source, imageQuality: 80, maxWidth: 1024);
    if (xfile == null) return;
    widget.onPicked(File(xfile.path), _mealType);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('¿Qué vas a registrar?',
              style: TextStyle(color: AppTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 16),

          // Tipo de comida
          const Text('Tipo de comida', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final t in [
                  ('🌅', 'desayuno', 'Desayuno'),
                  ('☀️', 'almuerzo', 'Almuerzo'),
                  ('🌙', 'cena', 'Cena'),
                  ('🍎', 'snack', 'Snack'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _mealType = t.$2),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: _mealType == t.$2 ? AppTheme.primary.withOpacity(0.2) : AppTheme.secondary,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _mealType == t.$2 ? AppTheme.primary : AppTheme.divider,
                            width: _mealType == t.$2 ? 2 : 1,
                          ),
                        ),
                        child: Text('${t.$1} ${t.$3}',
                            style: TextStyle(
                              color: _mealType == t.$2 ? AppTheme.primary : Colors.white,
                              fontSize: 13,
                              fontWeight: _mealType == t.$2 ? FontWeight.w700 : FontWeight.w400,
                            )),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Origen de la imagen', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PickButton(
                  icon: Icons.camera_alt,
                  label: 'Cámara',
                  color: AppTheme.primary,
                  onTap: () => _pick(ImageSource.camera),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _PickButton(
                  icon: Icons.photo_library,
                  label: 'Galería',
                  color: AppTheme.accent,
                  onTap: () => _pick(ImageSource.gallery),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PickButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _PickButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 30),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _AnalyzingDialog extends StatelessWidget {
  const _AnalyzingDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: const Padding(
        padding: EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🔍', style: TextStyle(fontSize: 40)),
            SizedBox(height: 16),
            Text('Analizando tu comida...', style: TextStyle(color: AppTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
            SizedBox(height: 8),
            Text('La IA está detectando calorías y macros', textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            SizedBox(height: 20),
            CircularProgressIndicator(color: Color(0xFF2E7D32)),
          ],
        ),
      ),
    );
  }
}

class _FoodResultSheet extends StatefulWidget {
  final File imageFile;
  final FoodAnalysis analysis;
  final String mealType;
  final Function(String) onConfirm;

  const _FoodResultSheet({
    required this.imageFile,
    required this.analysis,
    required this.mealType,
    required this.onConfirm,
  });

  @override
  State<_FoodResultSheet> createState() => _FoodResultSheetState();
}

class _FoodResultSheetState extends State<_FoodResultSheet> {
  late String _mealType;

  @override
  void initState() {
    super.initState();
    _mealType = widget.mealType;
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.analysis;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (_, controller) => SingleChildScrollView(
        controller: controller,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: AppTheme.divider, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

              // Foto
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.file(widget.imageFile, width: double.infinity, height: 200, fit: BoxFit.cover),
              ),
              const SizedBox(height: 16),

              // Nombre + confianza
              Row(
                children: [
                  Expanded(
                    child: Text(a.nombre,
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w800)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: a.confianza == 'alta'
                          ? AppTheme.success.withOpacity(0.15)
                          : a.confianza == 'media'
                              ? Colors.orange.withOpacity(0.15)
                              : Colors.red.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      a.confianza == 'alta' ? '✓ Alta confianza' : a.confianza == 'media' ? '~ Media' : '? Baja',
                      style: TextStyle(
                        color: a.confianza == 'alta' ? AppTheme.success : a.confianza == 'media' ? Colors.orange : Colors.red,
                        fontSize: 11, fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (a.porcion.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(a.porcion, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              ],
              const SizedBox(height: 20),

              // Calorías principal
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF2E7D32).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF2E7D32).withOpacity(0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 10),
                    Text('${a.calorias}',
                        style: const TextStyle(color: AppTheme.textPrimary, fontSize: 36, fontWeight: FontWeight.w900)),
                    const SizedBox(width: 6),
                    const Text('kcal', style: TextStyle(color: AppTheme.textSecondary, fontSize: 18)),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Macros
              Row(
                children: [
                  _MacroDetail('Proteínas', '${a.proteinas}g', const Color(0xFF2196F3)),
                  const SizedBox(width: 10),
                  _MacroDetail('Carbohidratos', '${a.carbohidratos}g', const Color(0xFFFF9800)),
                  const SizedBox(width: 10),
                  _MacroDetail('Grasas', '${a.grasas}g', const Color(0xFFE91E63)),
                ],
              ),

              if (a.nota.isNotEmpty) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.divider),
                  ),
                  child: Row(
                    children: [
                      const Text('💡', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(a.nota, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12))),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 20),
              const Text('Registrar como:', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final t in [
                      ('🌅', 'desayuno', 'Desayuno'),
                      ('☀️', 'almuerzo', 'Almuerzo'),
                      ('🌙', 'cena', 'Cena'),
                      ('🍎', 'snack', 'Snack'),
                    ])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() => _mealType = t.$2),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: _mealType == t.$2 ? AppTheme.primary.withOpacity(0.2) : AppTheme.secondary,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: _mealType == t.$2 ? AppTheme.primary : AppTheme.divider,
                                width: _mealType == t.$2 ? 2 : 1,
                              ),
                            ),
                            child: Text('${t.$1} ${t.$3}',
                                style: TextStyle(
                                  color: _mealType == t.$2 ? AppTheme.primary : AppTheme.textPrimary,
                                  fontSize: 13,
                                  fontWeight: _mealType == t.$2 ? FontWeight.w700 : FontWeight.w400,
                                )),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => widget.onConfirm(_mealType),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Guardar comida ✓', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancelar', style: TextStyle(color: AppTheme.textSecondary)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MacroDetail extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MacroDetail(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800)),
            Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}
