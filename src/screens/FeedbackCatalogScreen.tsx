import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeedbackManager } from "../feedback";
import { useThemedStyles } from "../theme/useThemedStyles";
import { logger } from "../utils/logger";

export function FeedbackCatalogScreen() {
  const [undoCount, setUndoCount] = useState(0);

  const styles = useThemedStyles(
    colors => ({
      safeArea: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollView: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scroll: {
        padding: 20,
        paddingBottom: 100,
        paddingTop: 20,
        alignItems: "center",
      },
      title: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 40,
        color: colors.text1,
        alignSelf: "flex-start",
      },
      buttonContainer: {
        width: "100%",
        gap: 12,
        alignItems: "center",
      },
      button: {
        width: "90%",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
      },
      buttonRed: {
        backgroundColor: "#FF6B6B",
      },
      buttonBlue: {
        backgroundColor: "#4A90E2",
      },
      buttonGreen: {
        backgroundColor: "#4CAF50",
      },
      buttonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
      },
      hint: {
        marginTop: 24,
        fontSize: 12,
        color: colors.text2,
        alignSelf: "center",
      },
    }),
    [],
  );

  // SNACKBAR EXAMPLES

  const showAutoDismissSnackbar = (
    type: "success" | "error" | "warning" | "info",
  ) => {
    FeedbackManager.showSnackbar({
      message: `Auto-dismiss ${type} snackbar (3s)`,
      type,
      duration: 3000,
      position: "bottom",
    });
  };

  const showFixedSnackbar = () => {
    FeedbackManager.showSnackbar({
      message: "Fixed snackbar - tap to dismiss",
      type: "info",
      duration: 0, // Fixed - won't auto-dismiss
      position: "bottom",
    });
  };

  const showSnackbarWithUndo = () => {
    FeedbackManager.showSnackbar({
      message: "Item deleted",
      type: "info",
      duration: 5000,
      position: "bottom",
      action: {
        text: "UNDO",
        onPress: () => {
          setUndoCount(prev => prev + 1);
          FeedbackManager.showSnackbar({
            message: "Deletion undone",
            type: "success",
            duration: 2000,
          });
        },
      },
    });
  };

  const showSnackbarWithOK = () => {
    FeedbackManager.showSnackbar({
      message: "Settings saved successfully",
      type: "success",
      duration: 4000,
      position: "bottom",
      action: {
        text: "OK",
        onPress: () => {
          logger.debug("User acknowledged");
        },
      },
    });
  };

  // TOAST EXAMPLES

  const showToastWithCTA = (type: "success" | "error" | "warning" | "info") => {
    FeedbackManager.showToast({
      title:
        type === "success"
          ? "Success"
          : type === "error"
          ? "Error"
          : type === "warning"
          ? "Warning"
          : "Info",
      message: `Toast with ${type} type and action button`,
      type,
      duration: 5000,
      position: "top",
      action: {
        text: "VIEW",
        onPress: () => {
          logger.debug("View action pressed");
        },
      },
    });
  };

  const showToastWithUndo = () => {
    FeedbackManager.showToast({
      title: "Changes Applied",
      message: "Your changes have been saved",
      type: "info",
      duration: 5000,
      position: "top",
      action: {
        text: "UNDO",
        onPress: () => {
          setUndoCount(prev => prev + 1);
          FeedbackManager.showToast({
            title: "Reverted",
            message: "Changes have been undone",
            type: "success",
            duration: 2000,
          });
        },
      },
    });
  };

  const showToastWithOK = () => {
    FeedbackManager.showToast({
      title: "Update Available",
      message: "A new version is ready to install",
      type: "info",
      duration: 6000,
      position: "top",
      action: {
        text: "OK",
        onPress: () => {
          logger.debug("Acknowledged");
        },
      },
    });
  };

  // ALERT EXAMPLES

  const showSingleButtonAlert = (
    type: "success" | "error" | "warning" | "info",
  ) => {
    FeedbackManager.showAlert({
      title:
        type === "success"
          ? "Success!"
          : type === "error"
          ? "Error"
          : type === "warning"
          ? "Warning"
          : "Information",
      message: `This is a single button alert with ${type} type. Tap OK to dismiss.`,
      type,
      buttons: [{ text: "OK", style: "default" }],
    });
  };

  const showTwoButtonAlert = () => {
    FeedbackManager.showAlert({
      title: "Confirm Action",
      message: "Are you sure you want to proceed with this action?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          style: "default",
          onPress: () => {
            FeedbackManager.showSnackbar({
              message: "Action confirmed",
              type: "success",
            });
          },
        },
      ],
    });
  };

  const showThreeButtonAlert = () => {
    FeedbackManager.showAlert({
      title: "Choose an Option",
      message: "How would you like to proceed?",
      type: "info",
      buttons: [
        {
          text: "Option A",
          style: "default",
          onPress: () => {
            FeedbackManager.showSnackbar({
              message: "Option A selected",
              type: "info",
            });
          },
        },
        {
          text: "Option B",
          style: "default",
          onPress: () => {
            FeedbackManager.showSnackbar({
              message: "Option B selected",
              type: "info",
            });
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    });
  };

  const showDestructiveAlert = () => {
    FeedbackManager.showAlert({
      title: "Delete Account",
      message:
        "This will permanently delete your account and all data. This action cannot be undone.",
      type: "error",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            FeedbackManager.showSnackbar({
              message: "Account deletion cancelled (demo)",
              type: "info",
            });
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>Feedback</Text>

        <View style={styles.buttonContainer}>
          {/* Toast Views */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonRed,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showToastWithCTA("success")}
          >
            <Text style={styles.buttonText}>Toast View - Success</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonRed,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showToastWithCTA("error")}
          >
            <Text style={styles.buttonText}>Toast View - Error</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonRed,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showToastWithCTA("info")}
          >
            <Text style={styles.buttonText}>Toast View - Info</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonRed,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showToastWithUndo}
          >
            <Text style={styles.buttonText}>Toast with Undo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonRed,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showToastWithOK}
          >
            <Text style={styles.buttonText}>Toast with OK</Text>
          </Pressable>

          {/* Fixed Snackbar Views */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showFixedSnackbar}
          >
            <Text style={styles.buttonText}>Fixed Snackbar View</Text>
          </Pressable>

          {/* Auto Dismiss Snackbar Views */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showAutoDismissSnackbar("success")}
          >
            <Text style={styles.buttonText}>
              Auto Dismiss Snackbar - Success
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showAutoDismissSnackbar("error")}
          >
            <Text style={styles.buttonText}>Auto Dismiss Snackbar - Error</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showAutoDismissSnackbar("info")}
          >
            <Text style={styles.buttonText}>Auto Dismiss Snackbar - Info</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showSnackbarWithUndo}
          >
            <Text style={styles.buttonText}>Snackbar with Undo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonBlue,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showSnackbarWithOK}
          >
            <Text style={styles.buttonText}>Snackbar with OK</Text>
          </Pressable>

          {/* Single Button Alert Views */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showSingleButtonAlert("success")}
          >
            <Text style={styles.buttonText}>Single Button Alert - Success</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showSingleButtonAlert("error")}
          >
            <Text style={styles.buttonText}>Single Button Alert - Error</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => showSingleButtonAlert("info")}
          >
            <Text style={styles.buttonText}>Single Button Alert - Info</Text>
          </Pressable>

          {/* Two & Three Button Alerts */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showTwoButtonAlert}
          >
            <Text style={styles.buttonText}>Two Button Alert View</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showThreeButtonAlert}
          >
            <Text style={styles.buttonText}>Three Button Alert View</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.buttonGreen,
              pressed && { opacity: 0.8 },
            ]}
            onPress={showDestructiveAlert}
          >
            <Text style={styles.buttonText}>Destructive Alert (demo)</Text>
          </Pressable>

          <Text style={styles.hint}>Undo actions (demo): {undoCount}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
