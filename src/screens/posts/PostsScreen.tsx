import { DrawerActions } from "@react-navigation/native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, Text, View, Pressable } from "react-native";

import type { Post } from "../../api/types/api";
import { TopBar } from "../../components/TopBar";
import { APP_DISPLAY_NAME } from "../../config/appDisplayName";
import type { PostsMainCompositeProps } from "../../navigation/screenTypes";
import { useAppQuery } from "../../query/hooks/useAppQuery";
import { postService } from "../../services/postService";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { InlineLoading } from "../../utils/loading";
import { ErrorStateView, EmptyStateView } from "../../utils/emptyErrorStates";

type Props = PostsMainCompositeProps;

const PostsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [useInvalidUrl, setUseInvalidUrl] = useState(false);

  const {
    data: posts,
    isPending,
    error,
    refetch,
  } = useAppQuery(["posts", useInvalidUrl], () =>
    useInvalidUrl
      ? Promise.reject(new Error("Network request failed"))
      : postService.getPosts(),
  );

  const styles = useThemedStyles(
    colors => ({
      root: { flex: 1, backgroundColor: colors.background },
      container: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.background,
        paddingTop: 16,
      },
      centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: colors.background,
      },
      title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
        color: colors.text1,
      },
      row: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.grayBackground,
      },
      rowTitle: { fontSize: 16, fontWeight: "600", color: colors.text1 },
      rowBody: {
        fontSize: 14,
        opacity: 0.75,
        marginTop: 4,
        color: colors.text2,
      },
      toggleButton: {
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.grayBackground,
        borderRadius: 8,
        alignSelf: "flex-start",
      },
      toggleText: {
        fontSize: 14,
        color: colors.text2,
      },
    }),
    [],
  );

  const openMenu = () => navigation.dispatch(DrawerActions.openDrawer());

  const menuBar = (
    <TopBar topBarTitle={APP_DISPLAY_NAME} onMenuPress={openMenu} />
  );

  const handleRetry = () => {
    setUseInvalidUrl(false);
    void refetch();
  };

  if (isPending) {
    return (
      <View style={styles.root}>
        {menuBar}
        <View style={styles.centered}>
          <InlineLoading size="large" variant="spinner" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        {menuBar}
        <View style={styles.centered}>
          <ErrorStateView
            title={t("errorBoundary.title")}
            message="Unable to load posts. Please check your connection and try again."
            retryLabel={t("errorBoundary.tryAgain")}
            onRetry={handleRetry}
            layout="fullscreen"
          />
        </View>
      </View>
    );
  }

  const emptyPosts = posts?.length === 0;

  return (
    <View style={styles.root}>
      {menuBar}
      <View style={styles.container}>
        <Text style={styles.title}>{t("posts.title")}</Text>
        <Pressable
          style={styles.toggleButton}
          onPress={() => setUseInvalidUrl(!useInvalidUrl)}
          accessibilityRole="button"
          accessibilityLabel="Toggle error state demo"
        >
          <Text style={styles.toggleText}>
            {useInvalidUrl ? "Use valid URL" : "Simulate error (invalid URL)"}
          </Text>
        </Pressable>
        {emptyPosts ? (
          <EmptyStateView
            title={t("posts.empty")}
            description="There are no posts to display right now."
            layout="inline"
          />
        ) : (
          <FlatList<Post>
            data={posts ?? []}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowBody} numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default PostsScreen;
