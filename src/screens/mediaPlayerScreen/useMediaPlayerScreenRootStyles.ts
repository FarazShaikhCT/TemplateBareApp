import { useThemedStyles } from '../../theme/useThemedStyles';

export function useMediaPlayerScreenRootStyles(topInset: number) {
  return useThemedStyles(
    colors => ({
      root: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: topInset,
      },
      tabRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.grayBackground,
      },
      tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
      },
      tabBtnActive: {
        backgroundColor: colors.primary,
      },
      tabBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text2,
      },
      tabBtnTextActive: {
        color: colors.textOnPrimary,
      },
    }),
    [topInset],
  );
}
