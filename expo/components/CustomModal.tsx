import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import { BlurView } from "expo-blur";

interface CustomModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  confirmDestructive?: boolean;
}

export default function CustomModal({
  isVisible,
  onClose,
  title,
  message,
  cancelText,
  confirmText,
  onConfirm,
  confirmDestructive = false,
}: CustomModalProps) {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.3}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.modalContainer}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="light" style={styles.blurContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalMessage}>{message}</Text>
              <View style={styles.buttonContainer}>
                {cancelText && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                {confirmText && onConfirm && (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      confirmDestructive ? styles.destructiveButton : styles.confirmButton,
                    ]}
                    onPress={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.modalContent, styles.androidModal]}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <View style={styles.buttonContainer}>
              {cancelText && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>
              )}
              {confirmText && onConfirm && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    confirmDestructive ? styles.destructiveButton : styles.confirmButton,
                  ]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  blurContainer: {
    borderRadius: 20,
    overflow: "hidden",
    width: "85%",
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  androidModal: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    backgroundColor: "#8B5CF6",
  },
  destructiveButton: {
    backgroundColor: "#EF4444",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
