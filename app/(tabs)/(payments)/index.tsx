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
  X,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RotateCcw,
} from "lucide-react-native";
import { fetchPayments, formatDate, formatCurrency } from "@/lib/convex/api";
import type { PaymentTransaction } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  succeeded: { color: colors.accent.emerald, icon: CheckCircle, label: "Succeeded" },
  pending: { color: colors.accent.amber, icon: Clock, label: "Pending" },
  failed: { color: colors.accent.rose, icon: XCircle, label: "Failed" },
  refunded: { color: colors.accent.sky, icon: RotateCcw, label: "Refunded" },
  disputed: { color: colors.accent.amber, icon: AlertCircle, label: "Disputed" },
};

// Payment Card Component
function PaymentCard({ payment, onPress }: { payment: PaymentTransaction; onPress: () => void }) {
  const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const isPositive = payment.amount >= 0 && payment.type !== "refund" && payment.type !== "chargeback";
  const StatusIcon = statusConfig.icon;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`payment-card-${payment._id}`}
    >
      <View style={styles.cardInner}>
        {/* Direction Icon */}
        <View style={[styles.directionIcon, isPositive ? styles.positiveIcon : styles.negativeIcon]}>
          {isPositive ? (
            <ArrowUpRight size={18} color={colors.accent.emerald} strokeWidth={2} />
          ) : (
            <ArrowDownRight size={18} color={colors.accent.rose} strokeWidth={2} />
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.amountText, { color: isPositive ? colors.accent.emerald : colors.accent.rose }]}>
              {isPositive ? "+" : ""}{formatCurrency(payment.amount)}
            </Text>
            <Text style={styles.dateText}>{formatDate(payment.processedAt)}</Text>
          </View>

          <View style={styles.cardMeta}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
              <StatusIcon size={10} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Type Badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{payment.type}</Text>
            </View>

            {/* Plan Badge */}
            {payment.subscriptionPlan && (
              <View style={styles.planBadge}>
                <Text style={styles.planText}>{payment.subscriptionPlan}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Payment Detail Modal
function PaymentDetail({ payment, onClose }: { payment: PaymentTransaction; onClose: () => void }) {
  const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const isPositive = payment.amount >= 0 && payment.type !== "refund" && payment.type !== "chargeback";
  const StatusIcon = statusConfig.icon;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <CreditCard size={20} color={colors.text.secondary} />
            <Text style={styles.modalTitle}>Payment Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Amount Header */}
            <View style={styles.amountHeader}>
              <Text
                style={[styles.amountLarge, { color: isPositive ? colors.accent.emerald : colors.accent.rose }]}
              >
                {isPositive ? "+" : ""}{formatCurrency(payment.amount)}
              </Text>
              <Text style={styles.currencyLabel}>{payment.currency.toUpperCase()}</Text>
            </View>

            {/* Status & Type Badges */}
            <View style={styles.badgeRow}>
              <View style={[styles.badgeLarge, { backgroundColor: `${statusConfig.color}15`, borderColor: `${statusConfig.color}30` }]}>
                <StatusIcon size={14} color={statusConfig.color} />
                <Text style={[styles.badgeTextLarge, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
              <View style={[styles.badgeLarge, { backgroundColor: colors.bg.tertiary, borderColor: colors.border.default }]}>
                <Text style={styles.badgeTextLarge}>{payment.type}</Text>
              </View>
            </View>

            {/* Transaction Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Transaction</Text>
              <View style={styles.sectionCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID</Text>
                  <Text style={styles.detailValueMono} selectable numberOfLines={1}>
                    {payment.transactionId}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User ID</Text>
                  <Text style={styles.detailValueMono} selectable numberOfLines={1}>
                    {payment.userId}
                  </Text>
                </View>
                {payment.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{payment.description}</Text>
                  </View>
                )}
                {payment.subscriptionPlan && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan</Text>
                    <Text style={styles.detailValue}>{payment.subscriptionPlan}</Text>
                  </View>
                )}
                {payment.messagesAdded !== undefined && (
                  <View style={[styles.detailRow, styles.lastRow]}>
                    <Text style={styles.detailLabel}>Messages Added</Text>
                    <Text style={styles.detailValue}>{payment.messagesAdded}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Timestamps Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>Timestamps</Text>
              <View style={styles.sectionCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Processed</Text>
                  <Text style={styles.detailValue}>{formatDate(payment.processedAt)}</Text>
                </View>
                <View style={[styles.detailRow, styles.lastRow]}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>{formatDate(payment.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Stripe Section */}
            {payment.stripePaymentIntentId && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>Stripe</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Intent</Text>
                    <Text style={styles.detailValueMono} selectable numberOfLines={1}>
                      {payment.stripePaymentIntentId}
                    </Text>
                  </View>
                  {payment.stripeInvoiceId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Invoice</Text>
                      <Text style={styles.detailValueMono}>{payment.stripeInvoiceId}</Text>
                    </View>
                  )}
                  {payment.stripeChargeId && (
                    <View style={[styles.detailRow, styles.lastRow]}>
                      <Text style={styles.detailLabel}>Charge</Text>
                      <Text style={styles.detailValueMono}>{payment.stripeChargeId}</Text>
                    </View>
                  )}
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

export default function PaymentsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);

  const { data: payments, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    const sorted = [...payments].sort((a, b) => b.processedAt - a.processedAt);
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(
      (payment) =>
        payment.transactionId.toLowerCase().includes(query) ||
        payment.userId.toLowerCase().includes(query) ||
        payment.type.toLowerCase().includes(query) ||
        payment.status.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  const handlePaymentPress = useCallback((payment: PaymentTransaction) => {
    setSelectedPayment(payment);
  }, []);

  const renderPayment = useCallback(
    ({ item }: { item: PaymentTransaction }) => (
      <PaymentCard payment={item} onPress={() => handlePaymentPress(item)} />
    ),
    [handlePaymentPress]
  );

  const keyExtractor = useCallback((item: PaymentTransaction) => item._id, []);

  const stats = useMemo(() => {
    if (!payments) return { total: 0, succeeded: 0, revenue: 0, refunds: 0 };
    const succeeded = payments.filter((p) => p.status === "succeeded" && p.type === "payment");
    const refunds = payments.filter((p) => p.type === "refund" || p.type === "chargeback");
    return {
      total: payments.length,
      succeeded: succeeded.length,
      revenue: succeeded.reduce((sum, p) => sum + p.amount, 0),
      refunds: refunds.reduce((sum, p) => sum + Math.abs(p.amount), 0),
    };
  }, [payments]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.subtitle}>Track all transactions</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <StatBlock
          value={stats.total}
          label="Total"
          icon={<CreditCard size={14} color={colors.text.secondary} />}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={stats.succeeded}
          label="Success"
          icon={<CheckCircle size={14} color={colors.accent.emerald} />}
          color={colors.accent.emerald}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={formatCurrency(stats.revenue)}
          label="Revenue"
          icon={<TrendingUp size={14} color={colors.accent.violet} />}
          color={colors.accent.violet}
        />
        <View style={styles.statDivider} />
        <StatBlock
          value={formatCurrency(stats.refunds)}
          label="Refunds"
          icon={<RotateCcw size={14} color={colors.accent.rose} />}
          color={colors.accent.rose}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search payments..."
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
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={renderPayment}
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
              <CreditCard size={40} color={colors.text.muted} strokeWidth={1} />
              <Text style={styles.emptyTitle}>No payments found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "Payments will appear here"}
              </Text>
            </View>
          }
          testID="payments-list"
        />
      )}

      {/* Detail Modal */}
      {selectedPayment && (
        <PaymentDetail
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
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
    fontSize: 14,
  },
  statLabel: {
    ...typography.small,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    fontSize: 9,
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
    alignItems: "center",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  directionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  positiveIcon: {
    backgroundColor: `${colors.accent.emerald}15`,
  },
  negativeIcon: {
    backgroundColor: `${colors.accent.rose}15`,
  },
  cardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  amountText: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
  dateText: {
    ...typography.small,
    color: colors.text.muted,
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
  statusText: {
    ...typography.small,
    fontSize: 10,
  },
  typeBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  typeText: {
    ...typography.small,
    color: colors.text.tertiary,
    textTransform: "capitalize" as const,
    fontSize: 10,
  },
  planBadge: {
    backgroundColor: `${colors.accent.violet}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  planText: {
    ...typography.small,
    color: colors.accent.violet,
    textTransform: "capitalize" as const,
    fontSize: 10,
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
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.xl,
  },
  amountHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  amountLarge: {
    ...typography.metric,
  },
  currencyLabel: {
    ...typography.small,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  badgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  badgeTextLarge: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    textTransform: "capitalize" as const,
  },
  detailSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
    maxWidth: "55%",
    textAlign: "right",
  },
  detailValueMono: {
    ...typography.mono,
    color: colors.text.primary,
    maxWidth: "55%",
    textAlign: "right",
  },
});
