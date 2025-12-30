import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Crown,
  CreditCard,
  MessageSquare,
  Calendar,
  Activity,
  Bell,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Check,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  Smartphone,
  Hash,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react-native";
import {
  fetchUsers,
  formatDate,
  formatCurrency,
  setUserCredits,
  setUserMessages,
  setUserPlan,
  deleteUser,
  truncateId,
} from "@/lib/convex/api";
import type { User, SubscriptionPlan } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Email template storage key
const EMAIL_TEMPLATE_KEY = "vibracode_email_template";

// Default email template
const DEFAULT_EMAIL_TEMPLATE = {
  subject: "{firstName}, quick question from Vibracode",
  body: `Hey {firstName},

It's Sehind from Vibracode - I saw you've been using the app and wanted to reach out personally.

I'm curious: how did you first hear about Vibracode?

I read every reply myself, and as a thank you for taking a minute to share, I'll add $20 in credits to your account.

No catch, just genuinely want to learn what's working and make Vibracode better for you.

Talk soon,
Sehind Hemzani
Founder, Vibracode

P.S. Just hit reply - I'll see it directly.`,
};

// Function to get email template
async function getEmailTemplate(): Promise<typeof DEFAULT_EMAIL_TEMPLATE> {
  try {
    const stored = await AsyncStorage.getItem(EMAIL_TEMPLATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.log("Error reading email template:", e);
  }
  return DEFAULT_EMAIL_TEMPLATE;
}

const PLAN_CONFIG: Record<string, { color: string; label: string }> = {
  free: { color: colors.text.tertiary, label: "Free" },
  weekly_plus: { color: colors.accent.sky, label: "Weekly+" },
  pro: { color: colors.accent.violet, label: "Pro" },
  business: { color: colors.accent.amber, label: "Business" },
  enterprise: { color: colors.accent.rose, label: "Enterprise" },
};

const PLANS: SubscriptionPlan[] = ["free", "weekly_plus", "pro", "business", "enterprise"];

// Helper to get display name
function getDisplayName(user: User): string {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split("@")[0];
  return "Unknown User";
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
  onEdit,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.statCardLabel}>{label}</Text>
      <View style={styles.statCardValueRow}>
        <Text style={styles.statCardValue}>{value}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Edit3 size={12} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Section Component with collapse
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {isOpen ? (
          <ChevronUp size={16} color={colors.text.muted} />
        ) : (
          <ChevronDown size={16} color={colors.text.muted} />
        )}
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

// Detail Row Component
function DetailRow({
  label,
  value,
  icon,
  onEdit,
  valueColor,
  mono = false,
}: {
  label: string;
  value: string | number | undefined;
  icon?: React.ReactNode;
  onEdit?: () => void;
  valueColor?: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      {icon && <View style={styles.detailIcon}>{icon}</View>}
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text
          style={[
            styles.detailValue,
            valueColor && { color: valueColor },
            mono && styles.monoText,
          ]}
          numberOfLines={1}
          selectable={mono}
        >
          {value ?? "—"}
        </Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.detailEditBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Edit3 size={12} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Edit Modal
function EditModal({
  visible,
  title,
  value,
  onSave,
  onClose,
  type = "number",
}: {
  visible: boolean;
  title: string;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
  type?: "number" | "text";
}) {
  const [inputValue, setInputValue] = useState(value);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType={type === "number" ? "numeric" : "default"}
            autoFocus
            placeholderTextColor={colors.text.muted}
            selectionColor={colors.accent.sky}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                onSave(inputValue);
                onClose();
              }}
            >
              <Check size={16} color={colors.text.inverse} />
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Plan Selection Modal
function PlanModal({
  visible,
  currentPlan,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentPlan: string;
  onSave: (plan: SubscriptionPlan) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Plan</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.planList}>
            {PLANS.map((plan) => {
              const config = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
              const isSelected = currentPlan === plan;

              return (
                <TouchableOpacity
                  key={plan}
                  style={[styles.planOption, isSelected && styles.planOptionSelected]}
                  onPress={() => {
                    onSave(plan);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.planDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.planOptionText, isSelected && styles.planOptionTextSelected]}>
                    {config.label}
                  </Text>
                  {isSelected && <Check size={16} color={colors.accent.emerald} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editModal, setEditModal] = useState<{
    visible: boolean;
    title: string;
    value: string;
    field: "credits" | "messages" | null;
  }>({ visible: false, title: "", value: "", field: null });
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);

  // Load email template on mount
  useEffect(() => {
    getEmailTemplate().then(setEmailTemplate);
  }, []);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const user = users?.find((u) => u._id === userId || u.clerkId === userId);
  const planConfig = PLAN_CONFIG[user?.subscriptionPlan || "free"] || PLAN_CONFIG.free;
  const isPaid = user?.subscriptionPlan && user.subscriptionPlan !== "free";
  const displayName = user ? getDisplayName(user) : "";
  const hasAvatar = !!user?.imageUrl;

  const handleSaveEdit = async (value: string) => {
    if (!user || !editModal.field) return;
    setIsUpdating(true);

    let success = false;
    if (editModal.field === "credits") {
      success = await setUserCredits(user._id, parseFloat(value));
    } else if (editModal.field === "messages") {
      success = await setUserMessages(user._id, parseInt(value, 10));
    }

    setIsUpdating(false);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "User updated successfully");
    } else {
      Alert.alert("Error", "Failed to update user");
    }
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    if (!user) return;
    setIsUpdating(true);

    const success = await setUserPlan(user._id, plan, true);

    setIsUpdating(false);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      Alert.alert("Success", "Plan updated successfully");
    } else {
      Alert.alert("Error", "Failed to update plan");
    }
  };

  const handleDeleteUser = () => {
    if (!user) return;

    Alert.alert(
      "Delete User",
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsUpdating(true);
            const success = await deleteUser(user._id);
            setIsUpdating(false);

            if (success) {
              queryClient.invalidateQueries({ queryKey: ["users"] });
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const handleSendEmail = async () => {
    if (!user?.email) {
      Alert.alert("No Email", "This user doesn't have an email address.");
      return;
    }

    // Get the latest template
    const template = await getEmailTemplate();

    // Replace placeholders in subject and body
    const firstName = user.firstName || user.fullName?.split(" ")[0] || "there";
    const lastName = user.lastName || user.fullName?.split(" ").slice(1).join(" ") || "";
    const fullName = user.fullName || `${firstName} ${lastName}`.trim() || "Friend";

    const subject = template.subject
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{fullName}/g, fullName)
      .replace(/{email}/g, user.email);

    const body = template.body
      .replace(/{firstName}/g, firstName)
      .replace(/{lastName}/g, lastName)
      .replace(/{fullName}/g, fullName)
      .replace(/{email}/g, user.email);

    // Create Gmail URL
    const gmailUrl = `googlegmail://co?to=${encodeURIComponent(user.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailtoUrl = `mailto:${encodeURIComponent(user.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Try Gmail first, fall back to default mail
    const canOpenGmail = await Linking.canOpenURL(gmailUrl);
    if (canOpenGmail) {
      await Linking.openURL(gmailUrl);
    } else {
      await Linking.openURL(mailtoUrl);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.text.tertiary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {hasAvatar ? (
            <Image source={{ uri: user.imageUrl }} style={[styles.avatarLarge, isPaid && styles.avatarLargePaid]} />
          ) : (
            <View style={[styles.avatarLarge, styles.avatarPlaceholder, isPaid && styles.avatarLargePaid]}>
              <UserIcon size={32} color={isPaid ? colors.accent.violet : colors.text.tertiary} strokeWidth={1.5} />
            </View>
          )}

          <Text style={styles.userNameText}>{displayName}</Text>

          {user.email && (
            <Text style={styles.userEmailText}>{user.email}</Text>
          )}

          <TouchableOpacity
            style={[styles.planBadgeLarge, { backgroundColor: `${planConfig.color}20` }]}
            onPress={() => setPlanModalVisible(true)}
            activeOpacity={0.7}
          >
            {isPaid && <Sparkles size={12} color={planConfig.color} />}
            <Text style={[styles.planBadgeText, { color: planConfig.color }]}>
              {planConfig.label}
            </Text>
            <Edit3 size={10} color={planConfig.color} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Credits"
            value={user.creditsUSD !== undefined ? formatCurrency(user.creditsUSD) : "$0.00"}
            icon={<DollarSign size={16} color={colors.accent.emerald} />}
            color={colors.accent.emerald}
            onEdit={() =>
              setEditModal({
                visible: true,
                title: "Edit Credits (USD)",
                value: String(user.creditsUSD ?? 0),
                field: "credits",
              })
            }
          />
          <StatCard
            label="Messages"
            value={user.messagesRemaining ?? 0}
            icon={<MessageSquare size={16} color={colors.accent.sky} />}
            color={colors.accent.sky}
            onEdit={() =>
              setEditModal({
                visible: true,
                title: "Edit Messages",
                value: String(user.messagesRemaining ?? 0),
                field: "messages",
              })
            }
          />
          <StatCard
            label="Total Paid"
            value={user.totalPaidUSD !== undefined ? formatCurrency(user.totalPaidUSD) : "$0.00"}
            icon={<CreditCard size={16} color={colors.accent.violet} />}
            color={colors.accent.violet}
          />
          <StatCard
            label="Profit"
            value={user.profitUSD !== undefined ? formatCurrency(user.profitUSD) : "$0.00"}
            icon={<TrendingUp size={16} color={colors.accent.amber} />}
            color={colors.accent.amber}
          />
        </View>

        {/* Account Section */}
        <Section title="Account">
          {user.email && (
            <DetailRow
              label="Email"
              value={user.email}
              icon={<Mail size={14} color={colors.accent.sky} />}
            />
          )}
          <DetailRow
            label="Clerk ID"
            value={user.clerkId}
            icon={<Hash size={14} color={colors.text.muted} />}
            mono
          />
          <DetailRow
            label="Agent Type"
            value={user.agentType || "cursor"}
            icon={<Sparkles size={14} color={colors.accent.violet} />}
          />
          <DetailRow
            label="Billing Mode"
            value={user.billingMode || "tokens"}
            icon={<Activity size={14} color={colors.text.muted} />}
          />
          <DetailRow
            label="Created"
            value={formatDate(user._creationTime)}
            icon={<Calendar size={14} color={colors.text.muted} />}
          />
        </Section>

        {/* Subscription Section */}
        <Section title="Subscription">
          <DetailRow
            label="Plan"
            value={planConfig.label}
            icon={<Crown size={14} color={planConfig.color} />}
            onEdit={() => setPlanModalVisible(true)}
            valueColor={planConfig.color}
          />
          <DetailRow
            label="Status"
            value={user.subscriptionStatus || "active"}
            icon={<Shield size={14} color={colors.text.muted} />}
            valueColor={user.subscriptionStatus === "active" ? colors.accent.emerald : undefined}
          />
          <DetailRow
            label="Will Renew"
            value={user.willRenew === undefined ? "—" : user.willRenew ? "Yes" : "No"}
            valueColor={user.willRenew ? colors.accent.emerald : colors.accent.rose}
          />
          <DetailRow
            label="Canceled"
            value={user.isCanceled === undefined ? "—" : user.isCanceled ? "Yes" : "No"}
            valueColor={user.isCanceled ? colors.accent.rose : colors.accent.emerald}
          />
        </Section>

        {/* Usage Section */}
        <Section title="Usage">
          <DetailRow
            label="Messages Remaining"
            value={user.messagesRemaining ?? 0}
            icon={<MessageSquare size={14} color={colors.accent.emerald} />}
            onEdit={() =>
              setEditModal({
                visible: true,
                title: "Edit Messages",
                value: String(user.messagesRemaining ?? 0),
                field: "messages",
              })
            }
          />
          <DetailRow
            label="Messages Used"
            value={user.messagesUsed ?? 0}
            icon={<Activity size={14} color={colors.text.muted} />}
          />
          <DetailRow
            label="Credits Used"
            value={user.creditsUsed !== undefined ? formatCurrency(user.creditsUsed) : "$0.00"}
            icon={<DollarSign size={14} color={colors.text.muted} />}
          />
          <DetailRow
            label="Real Cost"
            value={user.realCostUSD !== undefined ? formatCurrency(user.realCostUSD) : "$0.00"}
            icon={<TrendingUp size={14} color={colors.text.muted} />}
          />
        </Section>

        {/* Stripe Section */}
        {(user.stripeCustomerId || user.stripeSubscriptionId) && (
          <Section title="Stripe" defaultOpen={false}>
            {user.stripeCustomerId && (
              <DetailRow
                label="Customer ID"
                value={user.stripeCustomerId}
                icon={<CreditCard size={14} color={colors.text.muted} />}
                mono
              />
            )}
            {user.stripeSubscriptionId && (
              <DetailRow label="Subscription ID" value={user.stripeSubscriptionId} mono />
            )}
          </Section>
        )}

        {/* Device Section */}
        <Section title="Device" defaultOpen={false}>
          <DetailRow
            label="Notifications"
            value={user.notificationsEnabled ? "Enabled" : "Disabled"}
            icon={<Bell size={14} color={user.notificationsEnabled ? colors.accent.emerald : colors.text.muted} />}
            valueColor={user.notificationsEnabled ? colors.accent.emerald : colors.text.muted}
          />
          <DetailRow
            label="Push Token"
            value={user.pushToken ? "Connected" : "Not set"}
            icon={<Smartphone size={14} color={colors.text.muted} />}
            valueColor={user.pushToken ? colors.accent.emerald : colors.text.muted}
          />
        </Section>

        {/* Activity Section */}
        <Section title="Activity" defaultOpen={false}>
          {user.lastPaymentDate && (
            <DetailRow
              label="Last Payment"
              value={formatDate(user.lastPaymentDate)}
              icon={<Clock size={14} color={colors.accent.emerald} />}
            />
          )}
          {user.lastMessageReset && (
            <DetailRow
              label="Last Message Reset"
              value={formatDate(user.lastMessageReset)}
              icon={<Clock size={14} color={colors.text.muted} />}
            />
          )}
          {user.lastCostUpdate && (
            <DetailRow
              label="Last Cost Update"
              value={formatDate(user.lastCostUpdate)}
              icon={<Clock size={14} color={colors.text.muted} />}
            />
          )}
        </Section>

        {/* Email Button */}
        {user.email && (
          <TouchableOpacity style={styles.emailBtn} onPress={handleSendEmail} activeOpacity={0.7}>
            <Mail size={16} color={colors.accent.sky} />
            <Text style={styles.emailBtnText}>Send Email</Text>
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteUser} activeOpacity={0.7}>
          <Trash2 size={16} color={colors.accent.rose} />
          <Text style={styles.deleteBtnText}>Delete User</Text>
        </TouchableOpacity>

        {/* Updating Overlay */}
        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <ActivityIndicator size="small" color={colors.text.primary} />
            <Text style={styles.updatingText}>Updating...</Text>
          </View>
        )}
      </ScrollView>

      <EditModal
        visible={editModal.visible}
        title={editModal.title}
        value={editModal.value}
        onSave={handleSaveEdit}
        onClose={() => setEditModal({ ...editModal, visible: false })}
      />

      <PlanModal
        visible={planModalVisible}
        currentPlan={user.subscriptionPlan || "free"}
        onSave={handleSavePlan}
        onClose={() => setPlanModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg.primary,
    gap: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.accent.rose,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.md,
  },
  backButtonText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  profileHeader: {
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  avatarPlaceholder: {
    backgroundColor: colors.bg.tertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  avatarLargePaid: {
    borderWidth: 3,
    borderColor: `${colors.accent.violet}50`,
  },
  userNameText: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmailText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  planBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  planBadgeText: {
    ...typography.small,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statCardLabel: {
    ...typography.small,
    color: colors.text.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statCardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statCardValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  editIconBtn: {
    padding: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.muted,
  },
  sectionContent: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  detailIcon: {
    width: 28,
    alignItems: "center",
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: "55%",
  },
  detailValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
    textAlign: "right",
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: 10,
  },
  detailEditBtn: {
    padding: spacing.xs,
  },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.accent.sky}15`,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.accent.sky}30`,
  },
  emailBtnText: {
    ...typography.bodyMedium,
    color: colors.accent.sky,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.accent.rose}15`,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.accent.rose}30`,
  },
  deleteBtnText: {
    ...typography.bodyMedium,
    color: colors.accent.rose,
  },
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(9, 9, 11, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.lg,
  },
  updatingText: {
    ...typography.caption,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalInput: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  modalCancelText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  modalSaveBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.accent,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  modalSaveText: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
  planList: {
    gap: spacing.sm,
  },
  planOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  planOptionSelected: {
    borderColor: colors.accent.emerald,
    backgroundColor: `${colors.accent.emerald}10`,
  },
  planDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  planOptionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  planOptionTextSelected: {
    color: colors.text.primary,
  },
});
