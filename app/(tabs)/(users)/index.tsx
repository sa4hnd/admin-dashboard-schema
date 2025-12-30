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
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Search,
  ChevronRight,
  User as UserIcon,
  Sparkles,
  Users as UsersIcon,
  Crown,
  UserCheck,
  Mail,
} from "lucide-react-native";
import { fetchUsers } from "@/lib/convex/api";
import type { User } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";

// Helper to get display name
function getDisplayName(user: User): string {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split("@")[0];
  return user.clerkId.slice(0, 12) + "...";
}

function UserCard({ user, onPress }: { user: User; onPress: () => void }) {
  const isPaid = user.subscriptionPlan && user.subscriptionPlan !== "free";
  const planLabel = (user.subscriptionPlan || "free").replace("_", " ");
  const displayName = getDisplayName(user);
  const hasAvatar = !!user.imageUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`user-card-${user._id}`}
    >
      <View style={styles.cardInner}>
        {/* Avatar */}
        {hasAvatar ? (
          <Image source={{ uri: user.imageUrl }} style={[styles.avatar, isPaid && styles.avatarPaid]} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, isPaid && styles.avatarPaid]}>
            <UserIcon
              size={18}
              color={isPaid ? colors.accent.violet : colors.text.tertiary}
              strokeWidth={1.5}
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            {isPaid && (
              <View style={styles.premiumBadge}>
                <Sparkles size={10} color={colors.accent.violet} />
              </View>
            )}
          </View>

          {/* Email subtitle if we have a name */}
          {user.email && user.fullName && (
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          )}

          <View style={styles.cardMeta}>
            <View style={[styles.planBadge, isPaid && styles.planBadgePaid]}>
              <Text style={[styles.planText, isPaid && styles.planTextPaid]}>
                {planLabel}
              </Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statText}>
                {user.messagesRemaining ?? 0} msgs
              </Text>
            </View>
            {user.creditsUSD !== undefined && user.creditsUSD > 0 && (
              <View style={styles.statPill}>
                <Text style={[styles.statText, styles.creditText]}>
                  ${user.creditsUSD.toFixed(2)}
                </Text>
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
  color = colors.text.primary
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

export default function UsersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.clerkId.toLowerCase().includes(query) ||
        (user.fullName || "").toLowerCase().includes(query) ||
        (user.firstName || "").toLowerCase().includes(query) ||
        (user.lastName || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.subscriptionPlan || "").toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleUserPress = useCallback(
    (userId: string) => {
      router.push(`/(tabs)/(users)/${userId}`);
    },
    [router]
  );

  const renderUser = useCallback(
    ({ item }: { item: User }) => (
      <UserCard user={item} onPress={() => handleUserPress(item._id)} />
    ),
    [handleUserPress]
  );

  const keyExtractor = useCallback((item: User) => item._id, []);

  const stats = useMemo(() => {
    if (!users) return { total: 0, paid: 0, free: 0 };
    const paid = users.filter(
      (u) => u.subscriptionPlan && u.subscriptionPlan !== "free"
    ).length;
    return { total: users.length, paid, free: users.length - paid };
  }, [users]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>Manage your user base</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatBlock
          value={stats.total}
          label="Total"
          icon={<UsersIcon size={14} color={colors.text.secondary} />}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.paid}
          label="Premium"
          icon={<Crown size={14} color={colors.accent.violet} />}
          color={colors.accent.violet}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.free}
          label="Free"
          icon={<UserCheck size={14} color={colors.text.tertiary} />}
          color={colors.text.tertiary}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or plan..."
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
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
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
              <UserIcon size={40} color={colors.text.muted} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Users will appear here"}
              </Text>
            </View>
          }
          testID="users-list"
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.bg.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPaid: {
    borderWidth: 2,
    borderColor: `${colors.accent.violet}50`,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  userName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  userEmail: {
    ...typography.small,
    color: colors.text.muted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  premiumBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: `${colors.accent.violet}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  planBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.tertiary,
  },
  planBadgePaid: {
    backgroundColor: `${colors.accent.violet}15`,
  },
  planText: {
    ...typography.small,
    color: colors.text.tertiary,
    textTransform: "capitalize" as const,
  },
  planTextPaid: {
    color: colors.accent.violet,
  },
  statPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.tertiary,
  },
  statText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  creditText: {
    color: colors.accent.emerald,
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
