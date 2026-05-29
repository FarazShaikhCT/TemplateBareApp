import { Platform, StyleSheet } from "react-native";

import { useThemedStyles } from "../../theme/useThemedStyles";

export function useMediaPlayerPlayerTabStyles() {
  return useThemedStyles(
    colors => ({
      scrollView: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scroll: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: colors.background,
      },
      title: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 8,
        color: colors.text1,
      },
      caption: {
        fontSize: 14,
        color: colors.text2,
        marginBottom: 12,
      },
      modeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
      },
      modeBtn: {
        flexGrow: 1,
        flexBasis: "30%",
        minWidth: 96,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: colors.grayBackground,
        alignItems: "center",
      },
      modeBtnActive: {
        backgroundColor: colors.primary,
      },
      modeBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.text2,
        textAlign: "center",
      },
      modeBtnTextActive: {
        color: colors.textOnPrimary,
      },
      playerWrap: {
        backgroundColor: "#000",
        borderRadius: 8,
        overflow: "hidden",
        aspectRatio: 16 / 9,
        width: "100%",
      },
      offlinePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        backgroundColor: colors.grayBackground,
      },
      offlinePlaceholderText: {
        fontSize: 14,
        color: colors.text2,
        textAlign: "center",
      },
      video: {
        ...StyleSheet.absoluteFillObject,
      },
      spinnerWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
      },
      error: {
        color: colors.error,
        marginTop: 12,
      },
      hint: {
        marginTop: 12,
        fontSize: 13,
        color: colors.text2,
      },
      mono: {
        fontFamily: Platform.select({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
        fontSize: 12,
        color: colors.text1,
      },
      pipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
        marginBottom: 4,
        alignItems: "center",
      },
      pipBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.grayBackground,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.text2,
      },
      pipBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.text1,
      },
      pipHint: {
        flex: 1,
        minWidth: 120,
        fontSize: 12,
        color: colors.text2,
      },
    }),
    [],
  );
}
