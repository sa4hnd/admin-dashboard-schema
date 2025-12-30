import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User,
  Bot,
  X,
  Code,
  Terminal,
  Globe,
  FileText,
  MessageSquare,
  DollarSign,
  Cpu,
} from "lucide-react-native";
import { fetchMessages, formatCurrency } from "@/lib/convex/api";
import type { Message } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";

// Message Card Component
function MessageCard({ message, onPress }: { message: Message; onPress: () => void }) {
  const isUser = message.role === "user";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`message-card-${message._id}`}
    >
      <View style={styles.cardInner}>
        {/* Role Icon */}
        <View style={[styles.roleIcon, isUser && styles.userRoleIcon]}>
          {isUser ? (
            <User size={16} color={colors.text.primary} />
          ) : (
            <Bot size={16} color={colors.accent.violet} />
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.roleLabel}>{isUser ? "User" : "Assistant"}</Text>
            {message.costUSD !== undefined && message.costUSD > 0 && (
              <Text style={styles.costLabel}>${message.costUSD.toFixed(4)}</Text>
            )}
          </View>

          <Text style={styles.contentPreview} numberOfLines={2}>
            {message.content}
          </Text>

          {/* Meta row with badges */}
          <View style={styles.cardMeta}>
            {message.modelUsed && (
              <View style={styles.modelBadge}>
                <Text style={styles.modelText}>
                  {message.modelUsed.split("/").pop()}
                </Text>
              </View>
            )}
            {message.bash && (
              <View style={styles.toolBadge}>
                <Terminal size={10} color={colors.accent.emerald} />
              </View>
            )}
            {message.edits && (
              <View style={styles.toolBadge}>
                <Code size={10} color={colors.accent.amber} />
              </View>
            )}
            {message.webSearch && (
              <View style={styles.toolBadge}>
                <Globe size={10} color={colors.accent.sky} />
              </View>
            )}
            {message.read && (
              <View style={styles.toolBadge}>
                <FileText size={10} color={colors.text.tertiary} />
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Message Detail Modal
function MessageDetail({ message, onClose }: { message: Message; onClose: () => void }) {
  const isUser = message.role === "user";

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={[styles.roleIconLarge, isUser && styles.userRoleIconLarge]}>
              {isUser ? (
                <User size={22} color={colors.text.primary} />
              ) : (
                <Bot size={22} color={colors.accent.violet} />
              )}
            </View>
            <Text style={styles.modalTitle}>{isUser ? "User" : "Assistant"}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Content Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Content</Text>
              <View style={styles.contentBox}>
                <Text style={styles.contentFull} selectable>
                  {message.content}
                </Text>
              </View>
            </View>

            {/* Meta Grid */}
            <View style={styles.metaGrid}>
              {message.costUSD !== undefined && (
                <View style={styles.metaCard}>
                  <DollarSign size={14} color={colors.accent.emerald} />
                  <Text style={styles.metaLabel}>Cost</Text>
                  <Text style={styles.metaValue}>{formatCurrency(message.costUSD)}</Text>
                </View>
              )}
              {message.modelUsed && (
                <View style={styles.metaCard}>
                  <Cpu size={14} color={colors.accent.violet} />
                  <Text style={styles.metaLabel}>Model</Text>
                  <Text style={styles.metaValue} numberOfLines={1}>
                    {message.modelUsed.split("/").pop()}
                  </Text>
                </View>
              )}
              {message.inputTokens !== undefined && (
                <View style={styles.metaCard}>
                  <Text style={styles.metaLabel}>Input Tokens</Text>
                  <Text style={styles.metaValue}>{message.inputTokens.toLocaleString()}</Text>
                </View>
              )}
              {message.outputTokens !== undefined && (
                <View style={styles.metaCard}>
                  <Text style={styles.metaLabel}>Output Tokens</Text>
                  <Text style={styles.metaValue}>{message.outputTokens.toLocaleString()}</Text>
                </View>
              )}
              {message.durationMs !== undefined && (
                <View style={styles.metaCard}>
                  <Text style={styles.metaLabel}>Duration</Text>
                  <Text style={styles.metaValue}>{(message.durationMs / 1000).toFixed(2)}s</Text>
                </View>
              )}
            </View>

            {/* Bash Command Section */}
            {message.bash && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Bash Command</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{message.bash.command}</Text>
                </View>
                {message.bash.output && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Output</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeText} numberOfLines={10}>
                        {message.bash.output}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* File Edit Section */}
            {message.edits && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>File Edit</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{message.edits.filePath}</Text>
                </View>
              </View>
            )}

            {/* Web Search Section */}
            {message.webSearch && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Web Search</Text>
                <View style={styles.contentBox}>
                  <Text style={styles.contentFull}>{message.webSearch.query}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Stat Block Component
function StatBlock({
  value,
  label,
  icon,
  color = colors.text.primary,
}: {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statIconRow}>
        {icon}
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: messages, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["messages"],
    queryFn: () => fetchMessages(),
  });

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    const sorted = [...messages].sort((a, b) => b._creationTime - a._creationTime);
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (message) =>
        message.content.toLowerCase().includes(query) ||
        message.role.toLowerCase().includes(query) ||
        (message.modelUsed || "").toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const handleMessagePress = useCallback((message: Message) => {
    setSelectedMessage(message);
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageCard message={item} onPress={() => handleMessagePress(item)} />
    ),
    [handleMessagePress]
  );

  const keyExtractor = useCallback((item: Message) => item._id, []);

  const stats = useMemo(() => {
    if (!messages) return { total: 0, user: 0, assistant: 0, totalCost: 0 };
    const user = messages.filter((m) => m.role === "user").length;
    const totalCost = messages.reduce((sum, m) => sum + (m.costUSD || 0), 0);
    return { total: messages.length, user, assistant: messages.length - user, totalCost };
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Browse all conversations</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatBlock
          value={stats.total}
          label="Total"
          icon={<MessageSquare size={14} color={colors.text.secondary} />}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.user}
          label="User"
          icon={<User size={14} color={colors.accent.sky} />}
          color={colors.accent.sky}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.assistant}
          label="AI"
          icon={<Bot size={14} color={colors.accent.violet} />}
          color={colors.accent.violet}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={formatCurrency(stats.totalCost)}
          label="Cost"
          icon={<DollarSign size={14} color={colors.accent.emerald} />}
          color={colors.accent.emerald}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text.tertiary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.text.tertiary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={40} color={colors.text.muted} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No messages found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Messages will appear here"}
              </Text>
            </View>
          }
          testID="messages-list"
        />
      )}

      {/* Detail Modal */}
      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xs,
  },
  searchWrapper: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    height: 48,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    height: "100%",
  },
  clearText: {
    ...typography.captionMedium,
    color: colors.accent.sky,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardInner: {
    flexDirection: "row",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: `${colors.accent.violet}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  userRoleIcon: {
    backgroundColor: `${colors.accent.sky}15`,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  roleLabel: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  costLabel: {
    ...typography.mono,
    color: colors.text.muted,
    fontSize: 11,
  },
  contentPreview: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  modelBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  modelText: {
    ...typography.small,
    color: colors.text.muted,
    fontSize: 10,
  },
  toolBadge: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.massive,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  roleIconLarge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: `${colors.accent.violet}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  userRoleIconLarge: {
    backgroundColor: `${colors.accent.sky}15`,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    marginLeft: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.xl,
  },
  detailSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  contentBox: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  contentFull: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 20,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metaCard: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    minWidth: 80,
    gap: spacing.xs,
  },
  metaLabel: {
    ...typography.small,
    color: colors.text.muted,
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  metaValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  codeBox: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  codeText: {
    ...typography.mono,
    color: colors.accent.emerald,
    lineHeight: 18,
  },
});
