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
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Search,
  ChevronRight,
  Terminal,
  Github,
  Layers,
  Activity,
  DollarSign,
} from "lucide-react-native";
import { fetchSessions, formatCurrency } from "@/lib/convex/api";
import type { Session } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  RUNNING: {
    color: colors.accent.emerald,
    bg: `${colors.accent.emerald}15`,
    label: "Running",
  },
  IN_PROGRESS: {
    color: colors.accent.sky,
    bg: `${colors.accent.sky}15`,
    label: "In Progress",
  },
  PUSH_COMPLETE: {
    color: colors.accent.violet,
    bg: `${colors.accent.violet}15`,
    label: "Push Complete",
  },
  PUSH_FAILED: {
    color: colors.accent.rose,
    bg: `${colors.accent.rose}15`,
    label: "Push Failed",
  },
};

function SessionCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const statusConfig = STATUS_CONFIG[session.status] || {
    color: colors.text.tertiary,
    bg: colors.bg.tertiary,
    label: session.status.toLowerCase().replace(/_/g, " "),
  };

  const hasGithub = !!session.githubRepository;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`session-card-${session._id}`}
    >
      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Terminal size={18} color={colors.text.secondary} strokeWidth={1.5} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.sessionName} numberOfLines={1}>
            {session.name}
          </Text>

          <View style={styles.cardMeta}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Message Count */}
            {session.messageCount !== undefined && (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{session.messageCount} msgs</Text>
              </View>
            )}

            {/* Cost */}
            {session.totalCostUSD !== undefined && session.totalCostUSD > 0 && (
              <View style={styles.metaPill}>
                <Text style={[styles.metaText, styles.costText]}>
                  {formatCurrency(session.totalCostUSD)}
                </Text>
              </View>
            )}

            {/* GitHub Badge */}
            {hasGithub && (
              <View style={styles.githubBadge}>
                <Github size={10} color={colors.text.tertiary} />
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <ChevronRight size={18} color={colors.text.muted} />
      </View>
    </TouchableOpacity>
  );
}

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

export default function SessionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sessions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (session) =>
        session.name.toLowerCase().includes(query) ||
        session._id.toLowerCase().includes(query) ||
        session.status.toLowerCase().includes(query) ||
        session.templateId.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const handleSessionPress = useCallback(
    (sessionId: string) => {
      router.push(`/(tabs)/(sessions)/${sessionId}`);
    },
    [router]
  );

  const renderSession = useCallback(
    ({ item }: { item: Session }) => (
      <SessionCard session={item} onPress={() => handleSessionPress(item._id)} />
    ),
    [handleSessionPress]
  );

  const keyExtractor = useCallback((item: Session) => item._id, []);

  const stats = useMemo(() => {
    if (!sessions) return { total: 0, running: 0, totalCost: 0 };
    const running = sessions.filter((s) => s.status === "RUNNING").length;
    const totalCost = sessions.reduce((sum, s) => sum + (s.totalCostUSD || 0), 0);
    return { total: sessions.length, running, totalCost };
  }, [sessions]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>Monitor development sessions</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatBlock
          value={stats.total}
          label="Total"
          icon={<Layers size={14} color={colors.text.secondary} />}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.running}
          label="Running"
          icon={<Activity size={14} color={colors.accent.emerald} />}
          color={colors.accent.emerald}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={formatCurrency(stats.totalCost)}
          label="Total Cost"
          icon={<DollarSign size={14} color={colors.accent.amber} />}
          color={colors.accent.amber}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sessions..."
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
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          renderItem={renderSession}
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
              <Terminal size={40} color={colors.text.muted} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No sessions found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Sessions will appear here"}
              </Text>
            </View>
          }
          testID="sessions-list"
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
    padding: spacing.lg,
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
    gap: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.sm,
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
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  sessionName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.small,
  },
  metaPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.tertiary,
  },
  metaText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  costText: {
    color: colors.accent.emerald,
  },
  githubBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
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
});
