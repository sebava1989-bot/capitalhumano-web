import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen> {
  List<Map<String, dynamic>> _ranking = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRanking();
  }

  Future<void> _loadRanking() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.get('/ranking') as List<dynamic>;
      setState(() {
        _ranking = data.map((e) => {
          'name': e['full_name'],
          'points': e['points'],
          'streak': e['streak'],
          'level': e['level'],
        }).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = 'No se pudo cargar el ranking'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.secondary,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppTheme.secondary,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFFFFD600), Color(0xFFFFA000)],
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
                      children: const [
                        Text('🏆 Ranking', style: TextStyle(color: Colors.black87, fontSize: 26, fontWeight: FontWeight.w800)),
                        SizedBox(height: 4),
                        Text('Top del gimnasio este mes', style: TextStyle(color: Colors.black54, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          if (_loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
            )
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _loadRanking, child: const Text('Reintentar')),
                  ],
                ),
              ),
            )
          else if (_ranking.length >= 3) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: _PodiumItem(rank: 2, data: _ranking[1], height: 90)),
                    const SizedBox(width: 8),
                    Expanded(child: _PodiumItem(rank: 1, data: _ranking[0], height: 120)),
                    const SizedBox(width: 8),
                    Expanded(child: _PodiumItem(rank: 3, data: _ranking[2], height: 70)),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _RankingItem(rank: i + 4, data: _ranking[i + 3]),
                  childCount: _ranking.length - 3,
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ],
      ),
    );
  }
}

class _PodiumItem extends StatelessWidget {
  final int rank;
  final Map<String, dynamic> data;
  final double height;

  const _PodiumItem({required this.rank, required this.data, required this.height});

  Color get _color {
    if (rank == 1) return const Color(0xFFFFD600);
    if (rank == 2) return const Color(0xFFB0BEC5);
    return const Color(0xFFFF8C00);
  }

  String get _medal {
    if (rank == 1) return '🥇';
    if (rank == 2) return '🥈';
    return '🥉';
  }

  @override
  Widget build(BuildContext context) {
    final name = (data['name'] as String).split(' ').first;
    return Column(
      children: [
        Text(_medal, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 6),
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: _color.withOpacity(0.2),
            shape: BoxShape.circle,
            border: Border.all(color: _color, width: 2),
          ),
          child: Center(
            child: Text(name[0].toUpperCase(),
                style: TextStyle(color: _color, fontSize: 18, fontWeight: FontWeight.w800)),
          ),
        ),
        const SizedBox(height: 6),
        Text(name,
            style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12, fontWeight: FontWeight.w600),
            overflow: TextOverflow.ellipsis),
        Text('${data['points']} pts',
            style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Container(
          height: height,
          decoration: BoxDecoration(
            color: _color.withOpacity(0.15),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(10),
              topRight: Radius.circular(10),
            ),
            border: Border.all(color: _color.withOpacity(0.4)),
          ),
          child: Center(
            child: Text('#$rank',
                style: TextStyle(color: _color, fontSize: 22, fontWeight: FontWeight.w900)),
          ),
        ),
      ],
    );
  }
}

class _RankingItem extends StatelessWidget {
  final int rank;
  final Map<String, dynamic> data;

  const _RankingItem({required this.rank, required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 28,
            child: Text('#$rank',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 10),
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                (data['name'] as String)[0].toUpperCase(),
                style: const TextStyle(color: AppTheme.primary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['name'] as String,
                    style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                Text('🔥 ${data['streak']} días de racha',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          Text('${data['points']} pts',
              style: const TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
