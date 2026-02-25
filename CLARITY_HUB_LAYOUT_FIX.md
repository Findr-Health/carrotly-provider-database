# 🎯 CLARITY HUB LAYOUT FIX

## File: `lib/presentation/screens/clarity/clarity_hub_screen.dart`

## Location: Inside the `Column` widget (around line 50-130)

## FIND THIS SECTION:
```dart
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle indicator
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                // Header
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        LucideIcons.sparkles,
                        color: AppColors.primary,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'CLARITY',
                            style: TextStyle(
                              fontFamily: 'Urbanist',
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Your Healthcare Insider',
                            style: TextStyle(
                              fontFamily: 'Urbanist',
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Close button
                    IconButton(
                      icon: const Icon(Icons.close, size: 24, color: AppColors.textSecondary),
                      onPressed: () => Navigator.of(context).pop(),
                      tooltip: 'Close',
                      constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Hero Quote
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.2),
                      width: 1.5,
                    ),
                  ),
                  child: const Text(
                    '"They bet you won\'t question your bill. We give you the proof to fight back."',
                    style: TextStyle(
                      fontFamily: 'Urbanist',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

                const SizedBox(height: 24),

                // Option 1: Ask Me Anything (Chat)
                _ClarityOption(
                  icon: LucideIcons.messageCircle,
                  title: 'Ask Me Anything',
                  description: 'Insurance, costs, provider intel',
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF4FE8D0), AppColors.primary],
                  ),
                  onTap: () {
              Navigator.of(context).pop(); // Close modal first
              context.push(AppRoutes.chat);
            },
                ),

                const SizedBox(height: 16),

                // Option 2: Analyze Bill
                _ClarityOption(
                  icon: LucideIcons.fileText,
                  title: 'Analyze Your Bill',
                  description: 'Upload → Analyze → Save',
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary.withOpacity(0.8),
                      AppColors.primary,
                    ],
                  ),
                  onTap: () {
              Navigator.of(context).pop(); // Close modal first
              context.push(AppRoutes.clarityPrice);
            },
                ),

                const SizedBox(height: 24),

                // Community Stats
                if (!_isLoadingStats && _weeklyOvercharges > 0)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.success.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          LucideIcons.trendingUp,
                          color: AppColors.success,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                fontFamily: 'Urbanist',
                                fontSize: 14,
                                color: AppColors.textPrimary,
                              ),
                              children: [
                                const TextSpan(text: 'This week: '),
                                TextSpan(
                                  text: '\$${_weeklyOvercharges.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.success,
                                  ),
                                ),
                                const TextSpan(
                                  text: 'in overcharges spotted for Findr users',
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),


              ],
            ),
```

## REPLACE WITH (REORDERED):
```dart
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle indicator
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                // Header
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        LucideIcons.sparkles,
                        color: AppColors.primary,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'CLARITY',
                            style: TextStyle(
                              fontFamily: 'Urbanist',
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Your Healthcare Insider',
                            style: TextStyle(
                              fontFamily: 'Urbanist',
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Close button
                    IconButton(
                      icon: const Icon(Icons.close, size: 24, color: AppColors.textSecondary),
                      onPressed: () => Navigator.of(context).pop(),
                      tooltip: 'Close',
                      constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // ✅ ACTIONS FIRST - Option 1: Ask Me Anything (Chat)
                _ClarityOption(
                  icon: LucideIcons.messageCircle,
                  title: 'Ask Me Anything',
                  description: 'Insurance, costs, provider intel',
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF4FE8D0), AppColors.primary],
                  ),
                  onTap: () {
              Navigator.of(context).pop(); // Close modal first
              context.push(AppRoutes.chat);
            },
                ),

                const SizedBox(height: 16),

                // Option 2: Analyze Bill
                _ClarityOption(
                  icon: LucideIcons.fileText,
                  title: 'Analyze Your Bill',
                  description: 'Upload → Analyze → Save',
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary.withOpacity(0.8),
                      AppColors.primary,
                    ],
                  ),
                  onTap: () {
              Navigator.of(context).pop(); // Close modal first
              context.push(AppRoutes.clarityPrice);
            },
                ),

                const SizedBox(height: 24),

                // ✅ EMOTIONAL REINFORCEMENT - Hero Quote (moved below actions)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.2),
                      width: 1.5,
                    ),
                  ),
                  child: const Text(
                    '"They bet you won\'t question your bill. We give you the proof to fight back."',
                    style: TextStyle(
                      fontFamily: 'Urbanist',
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),

                const SizedBox(height: 16),

                // ✅ SOCIAL PROOF - Community Stats (moved to bottom)
                if (!_isLoadingStats && _weeklyOvercharges > 0)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.success.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          LucideIcons.trendingUp,
                          color: AppColors.success,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                fontFamily: 'Urbanist',
                                fontSize: 14,
                                color: AppColors.textPrimary,
                              ),
                              children: [
                                const TextSpan(text: 'This week: '),
                                TextSpan(
                                  text: '\$${_weeklyOvercharges.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} ',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.success,
                                  ),
                                ),
                                const TextSpan(
                                  text: 'in overcharges spotted for Findr users',
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),


              ],
            ),
```

## KEY CHANGES:
1. ✅ **Moved CTAs to top** (Ask Me Anything + Analyze Bill)
2. ✅ **Moved hero quote below CTAs** (emotional reinforcement)
3. ✅ **Moved stats to bottom** (social proof)

## BEHAVIORAL PSYCHOLOGY RATIONALE:
- **Action → Emotion → Social Proof** is the optimal persuasion hierarchy
- Users who opened modal are already motivated (pre-qualified)
- Show options first, validate choice with quote, close with community impact
