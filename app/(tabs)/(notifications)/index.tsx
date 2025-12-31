import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Bell, Send, Users, RefreshCw } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { broadcastPush, fetchUsers, fetchPushTokens } from "@/lib/convex/api";
import { colors, spacing, radius, typography } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Broadcast-specific template key (separate from individual notification template)
const BROADCAST_TEMPLATE_KEY = "vibracode_broadcast_template";

// Default broadcast template - no placeholders since broadcast goes to everyone
const DEFAULT_BROADCAST_TEMPLATE = {
  title: "Hey there! 👋",
  body: "We have something exciting to share with you. Check it out!",
};

async function getBroadcastTemplate(): Promise<typeof DEFAULT_BROADCAST_TEMPLATE> {
  try {
    const stored = await AsyncStorage.getItem(BROADCAST_TEMPLATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.log("Error reading broadcast template:", e);
  }
  return DEFAULT_BROADCAST_TEMPLATE;
}

async function saveBroadcastTemplate(template: typeof DEFAULT_BROADCAST_TEMPLATE): Promise<void> {
  try {
    await AsyncStorage.setItem(BROADCAST_TEMPLATE_KEY, JSON.stringify(template));
  } catch (e) {
    console.log("Error saving broadcast template:", e);
  }
}

export default function NotificationsScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch users to count those with push tokens
  const { data: users, refetch: refetchUsers, isRefetching } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // Load template on mount
  useEffect(() => {
    getBroadcastTemplate().then((template) => {
      setTitle(template.title);
      setBody(template.body);
    });
  }, []);

  // Count users with push tokens
  const usersWithTokens = users?.filter((u) => u.pushToken) || [];
  const tokenCount = usersWithTokens.length;

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Error", "Please enter both title and message");
      return;
    }

    if (tokenCount === 0) {
      Alert.alert("No Recipients", "No users have push notifications enabled.");
      return;
    }

    Alert.alert(
      "Confirm Broadcast",
      `This will send a notification to ${tokenCount} user${tokenCount !== 1 ? "s" : ""}. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          style: "default",
          onPress: async () => {
            setIsSending(true);
            const result = await broadcastPush(title, body);
            setIsSending(false);

            if (result.success) {
              Alert.alert(
                "Success",
                `Notification sent to ${result.sent || tokenCount} user${(result.sent || tokenCount) !== 1 ? "s" : ""}!`
              );
            } else {
              Alert.alert("Error", result.error || "Failed to send notification");
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    refetchUsers();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Bell size={28} color={colors.accent.violet} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Send push notifications to users</Text>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Users size={18} color={colors.accent.sky} />
          <Text style={styles.statLabel}>Users with notifications enabled</Text>
        </View>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{tokenCount}</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw
              size={16}
              color={colors.text.muted}
              style={isRefetching ? { opacity: 0.5 } : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Compose Section */}
      <View style={styles.composeCard}>
        <Text style={styles.sectionTitle}>Compose Broadcast</Text>

        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title..."
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.accent.violet}
        />

        <Text style={styles.inputLabel}>Message</Text>
        <TextInput
          style={[styles.input, styles.messageInput]}
          value={body}
          onChangeText={setBody}
          placeholder="Notification message..."
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.accent.violet}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.sendBtn, (isSending || tokenCount === 0) && styles.sendBtnDisabled]}
          onPress={handleBroadcast}
          disabled={isSending || tokenCount === 0}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <>
              <Send size={18} color={colors.text.inverse} />
              <Text style={styles.sendBtnText}>
                Broadcast to {tokenCount} User{tokenCount !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Tips</Text>
        <Text style={styles.tipText}>• Keep titles short and catchy (max 50 characters)</Text>
        <Text style={styles.tipText}>• Messages should be concise but informative</Text>
        <Text style={styles.tipText}>• Emojis can increase engagement 👋</Text>
        <Text style={styles.tipText}>• Broadcast sends the same message to everyone</Text>
        <Text style={styles.tipText}>• For personalized messages with names, use the individual user notification on their profile</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.massive,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: `${colors.accent.violet}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.accent.violet}30`,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  statsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statValue: {
    ...typography.h1,
    color: colors.accent.sky,
  },
  refreshBtn: {
    padding: spacing.sm,
  },
  composeCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.overline,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  messageInput: {
    minHeight: 120,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent.violet,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
  tipsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tipsTitle: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  tipText: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
});
