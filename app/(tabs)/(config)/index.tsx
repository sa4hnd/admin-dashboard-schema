import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Clock,
  User,
  Key,
  Database,
  Github,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Server,
  Mail,
  Edit3,
  X,
  Check,
} from "lucide-react-native";
import {
  fetchGlobalConfig,
  fetchConvexCredentials,
  fetchGitHubCredentials,
  formatDate,
  truncateId,
} from "@/lib/convex/api";
import type { GlobalConfig, ConvexProjectCredentials, GitHubCredentials } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Email template storage key and default
const EMAIL_TEMPLATE_KEY = "vibracode_email_template";

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

// Config Card Component
function ConfigCard({ config }: { config: GlobalConfig }) {
  return (
    <View style={styles.configCard}>
      <View style={styles.configHeader}>
        <View style={styles.keyIconWrap}>
          <Key size={12} color={colors.accent.amber} />
        </View>
        <Text style={styles.keyText}>{config.key}</Text>
      </View>
      <Text style={styles.valueText}>{config.value}</Text>
      <View style={styles.configFooter}>
        <Clock size={10} color={colors.text.muted} />
        <Text style={styles.footerText}>{formatDate(config.updatedAt)}</Text>
        {config.updatedBy && (
          <>
            <User size={10} color={colors.text.muted} style={styles.footerIcon} />
            <Text style={styles.footerText}>{truncateId(config.updatedBy, 12)}</Text>
          </>
        )}
      </View>
    </View>
  );
}

// Convex Credential Card
function ConvexCredCard({ cred }: { cred: ConvexProjectCredentials }) {
  return (
    <View style={styles.credCard}>
      <View style={styles.credHeader}>
        <View style={[styles.credIconWrap, { backgroundColor: `${colors.accent.amber}15` }]}>
          <Database size={16} color={colors.accent.amber} />
        </View>
        <View style={styles.credHeaderContent}>
          <Text style={styles.credTitle}>{cred.projectSlug}</Text>
          <Text style={styles.credSubtitle}>{cred.teamSlug}</Text>
        </View>
      </View>
      <View style={styles.credDetails}>
        <View style={styles.credRow}>
          <Text style={styles.credLabel}>User</Text>
          <Text style={styles.credValue}>{truncateId(cred.userId, 16)}</Text>
        </View>
        <View style={[styles.credRow, styles.lastRow]}>
          <Text style={styles.credLabel}>Deploy Key</Text>
          <Text style={styles.credValueMasked}>••••••••••••</Text>
        </View>
      </View>
    </View>
  );
}

// GitHub Credential Card
function GitHubCredCard({ cred }: { cred: GitHubCredentials }) {
  return (
    <View style={styles.credCard}>
      <View style={styles.credHeader}>
        <View style={[styles.credIconWrap, { backgroundColor: colors.bg.tertiary }]}>
          <Github size={16} color={colors.text.secondary} />
        </View>
        <View style={styles.credHeaderContent}>
          <Text style={styles.credTitle}>{cred.username}</Text>
          <Text style={styles.credSubtitle}>GitHub Account</Text>
        </View>
      </View>
      <View style={styles.credDetails}>
        <View style={styles.credRow}>
          <Text style={styles.credLabel}>Clerk ID</Text>
          <Text style={styles.credValue}>{truncateId(cred.clerkId, 16)}</Text>
        </View>
        <View style={styles.credRow}>
          <Text style={styles.credLabel}>Access Token</Text>
          <Text style={styles.credValueMasked}>••••••••••••</Text>
        </View>
        <View style={[styles.credRow, styles.lastRow]}>
          <Text style={styles.credLabel}>Connected</Text>
          <Text style={styles.credValue}>{formatDate(cred.connectedAt)}</Text>
        </View>
      </View>
    </View>
  );
}

// Section Component
function Section({
  title,
  icon,
  children,
  count,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  count?: number;
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
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <View style={styles.sectionRight}>
          {count !== undefined && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
          {isOpen ? (
            <ChevronUp size={16} color={colors.text.muted} />
          ) : (
            <ChevronDown size={16} color={colors.text.muted} />
          )}
        </View>
      </TouchableOpacity>
      {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

// Email Template Editor Modal
function EmailTemplateModal({
  visible,
  template,
  onSave,
  onClose,
}: {
  visible: boolean;
  template: typeof DEFAULT_EMAIL_TEMPLATE;
  onSave: (template: typeof DEFAULT_EMAIL_TEMPLATE) => void;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const handleSave = () => {
    onSave({ subject, body });
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Default",
      "Are you sure you want to reset the email template to the default?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setSubject(DEFAULT_EMAIL_TEMPLATE.subject);
            setBody(DEFAULT_EMAIL_TEMPLATE.body);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.emailModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Email Template</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.emailModalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.emailLabel}>Subject</Text>
            <TextInput
              style={styles.emailSubjectInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject..."
              placeholderTextColor={colors.text.muted}
              selectionColor={colors.accent.sky}
            />

            <Text style={styles.emailLabel}>Body</Text>
            <Text style={styles.emailHint}>
              Use {"{firstName}"}, {"{lastName}"}, {"{fullName}"}, {"{email}"} as placeholders
            </Text>
            <TextInput
              style={styles.emailBodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Email body..."
              placeholderTextColor={colors.text.muted}
              selectionColor={colors.accent.sky}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.emailModalActions}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Check size={16} color={colors.text.inverse} />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ConfigScreen() {
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  // Load email template on mount
  useEffect(() => {
    AsyncStorage.getItem(EMAIL_TEMPLATE_KEY).then((stored) => {
      if (stored) {
        try {
          setEmailTemplate(JSON.parse(stored));
        } catch (e) {
          console.log("Error parsing email template:", e);
        }
      }
    });
  }, []);

  const handleSaveEmailTemplate = async (template: typeof DEFAULT_EMAIL_TEMPLATE) => {
    try {
      await AsyncStorage.setItem(EMAIL_TEMPLATE_KEY, JSON.stringify(template));
      setEmailTemplate(template);
      Alert.alert("Success", "Email template saved successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to save email template");
    }
  };

  const {
    data: globalConfig,
    isLoading: configLoading,
    refetch: refetchConfig,
    isRefetching: configRefetching,
  } = useQuery({
    queryKey: ["globalConfig"],
    queryFn: fetchGlobalConfig,
  });

  const {
    data: convexCreds,
    isLoading: convexLoading,
    refetch: refetchConvex,
    isRefetching: convexRefetching,
  } = useQuery({
    queryKey: ["convexCredentials"],
    queryFn: fetchConvexCredentials,
  });

  const {
    data: githubCreds,
    isLoading: githubLoading,
    refetch: refetchGithub,
    isRefetching: githubRefetching,
  } = useQuery({
    queryKey: ["githubCredentials"],
    queryFn: fetchGitHubCredentials,
  });

  const isLoading = configLoading || convexLoading || githubLoading;
  const isRefetching = configRefetching || convexRefetching || githubRefetching;

  const handleRefresh = useCallback(() => {
    refetchConfig();
    refetchConvex();
    refetchGithub();
  }, [refetchConfig, refetchConvex, refetchGithub]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.text.tertiary} />
        <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={colors.text.tertiary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Settings size={28} color={colors.text.secondary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Global configuration and credentials</Text>
      </View>

      {/* Email Template Section */}
      <Section
        title="Email Template"
        icon={<Mail size={14} color={colors.accent.sky} />}
      >
        <View style={styles.emailTemplateCard}>
          <View style={styles.emailTemplateHeader}>
            <Text style={styles.emailTemplateSubject} numberOfLines={1}>
              {emailTemplate.subject}
            </Text>
            <TouchableOpacity
              onPress={() => setEmailModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={16} color={colors.accent.sky} />
            </TouchableOpacity>
          </View>
          <Text style={styles.emailTemplateBody} numberOfLines={4}>
            {emailTemplate.body}
          </Text>
          <TouchableOpacity
            style={styles.editTemplateBtn}
            onPress={() => setEmailModalVisible(true)}
            activeOpacity={0.7}
          >
            <Edit3 size={14} color={colors.accent.sky} />
            <Text style={styles.editTemplateBtnText}>Edit Template</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* Global Config Section */}
      <Section
        title="Global Config"
        icon={<Key size={14} color={colors.accent.amber} />}
        count={globalConfig?.length}
      >
        {globalConfig && globalConfig.length > 0 ? (
          <View style={styles.cardList}>
            {globalConfig.map((config) => (
              <ConfigCard key={config._id} config={config} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Shield size={24} color={colors.text.muted} strokeWidth={1} />
            <Text style={styles.emptyText}>No global configuration</Text>
          </View>
        )}
      </Section>

      {/* Convex Credentials Section */}
      <Section
        title="Convex Credentials"
        icon={<Database size={14} color={colors.accent.amber} />}
        count={convexCreds?.length}
      >
        {convexCreds && convexCreds.length > 0 ? (
          <View style={styles.cardList}>
            {convexCreds.map((cred) => (
              <ConvexCredCard key={cred._id} cred={cred} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Server size={24} color={colors.text.muted} strokeWidth={1} />
            <Text style={styles.emptyText}>No Convex credentials</Text>
          </View>
        )}
      </Section>

      {/* GitHub Connections Section */}
      <Section
        title="GitHub Connections"
        icon={<Github size={14} color={colors.text.secondary} />}
        count={githubCreds?.length}
      >
        {githubCreds && githubCreds.length > 0 ? (
          <View style={styles.cardList}>
            {githubCreds.map((cred) => (
              <GitHubCredCard key={cred._id} cred={cred} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Github size={24} color={colors.text.muted} strokeWidth={1} />
            <Text style={styles.emptyText}>No GitHub connections</Text>
          </View>
        )}
      </Section>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        activeOpacity={0.7}
      >
        <RefreshCw size={18} color={colors.text.inverse} />
        <Text style={styles.refreshButtonText}>Refresh All</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Email Template Modal */}
    <EmailTemplateModal
      visible={emailModalVisible}
      template={emailTemplate}
      onSave={handleSaveEmailTemplate}
      onClose={() => setEmailModalVisible(false)}
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
    paddingBottom: spacing.massive,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg.primary,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  header: {
    alignItems: "center",
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.tertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.subtle,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.muted,
  },
  sectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  countText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  sectionContent: {},
  cardList: {
    gap: spacing.sm,
  },
  configCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  configHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  keyIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: `${colors.accent.amber}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  valueText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  configFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footerIcon: {
    marginLeft: spacing.sm,
  },
  footerText: {
    ...typography.small,
    color: colors.text.muted,
    fontSize: 10,
  },
  credCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: "hidden",
  },
  credHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  credIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  credHeaderContent: {
    flex: 1,
  },
  credTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  credSubtitle: {
    ...typography.small,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  credDetails: {
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  credRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  credLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  credValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  credValueMasked: {
    ...typography.mono,
    color: colors.text.muted,
  },
  emptyCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  refreshButtonText: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
  // Email Template Styles
  emailTemplateCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  emailTemplateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emailTemplateSubject: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  emailTemplateBody: {
    ...typography.caption,
    color: colors.text.tertiary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  editTemplateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${colors.accent.sky}15`,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.accent.sky}30`,
  },
  editTemplateBtnText: {
    ...typography.captionMedium,
    color: colors.accent.sky,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  emailModalContainer: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  emailModalBody: {
    padding: spacing.xl,
    maxHeight: 500,
  },
  emailLabel: {
    ...typography.overline,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  emailHint: {
    ...typography.small,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    fontStyle: "italic",
  },
  emailSubjectInput: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emailBodyInput: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: 200,
  },
  emailModalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  resetBtnText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.accent,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  saveBtnText: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
});
