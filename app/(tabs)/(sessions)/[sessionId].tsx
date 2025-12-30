import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Play,
  Terminal,
  Github,
  Globe,
  Calendar,
  DollarSign,
  MessageSquare,
  Database,
  ExternalLink,
  User as UserIcon,
  Bot,
  ChevronDown,
  ChevronUp,
  X,
  Cpu,
  Clock,
  Zap,
  TrendingUp,
  Check,
  Edit3,
} from "lucide-react-native";
import {
  fetchSessions,
  fetchMessages,
  fetchUsers,
  formatDate,
  formatCurrency,
  resumeSandbox,
  updateSessionPushStatus,
  updateSessionStatus,
} from "@/lib/convex/api";
import type { Session, Message, User, GitHubPushStatus, SessionStatus } from "@/lib/types/admin";
import { colors, spacing, radius, typography } from "@/constants/theme";

// Helper to get display name
function getDisplayName(user: User | undefined): string {
  if (!user) return "Unknown";
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split("@")[0];
  return user.clerkId.slice(0, 12) + "...";
}

// Section Component with collapse
function Section({
  title,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
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
  isLink,
  mono = false,
  onEdit,
  valueColor,
}: {
  label: string;
  value: string | number | undefined;
  icon?: React.ReactNode;
  isLink?: boolean;
  mono?: boolean;
  onEdit?: () => void;
  valueColor?: string;
}) {
  const handlePress = () => {
    if (isLink && typeof value === "string") {
      Linking.openURL(value);
    }
  };

  const content = (
    <View style={styles.detailRow}>
      {icon && <View style={styles.detailIcon}>{icon}</View>}
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <Text
          style={[
            styles.detailValue,
            isLink && styles.linkValue,
            mono && styles.monoText,
            valueColor && { color: valueColor },
          ]}
          numberOfLines={2}
        >
          {value ?? "—"}
        </Text>
        {isLink && <ExternalLink size={12} color={colors.accent.sky} />}
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.detailEditBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Edit3 size={12} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLink && value) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// Environment Variable Row
function EnvVarRow({ name, value }: { name: string; value: string }) {
  const isSensitive =
    name.toLowerCase().includes("key") ||
    name.toLowerCase().includes("secret") ||
    name.toLowerCase().includes("token");

  return (
    <View style={styles.envRow}>
      <Text style={styles.envName}>{name}</Text>
      <Text style={styles.envValue} numberOfLines={1}>
        {isSensitive ? "••••••••" : value}
      </Text>
    </View>
  );
}

// Message Detail Modal
function MessageDetailModal({
  message,
  onClose,
}: {
  message: Message;
  onClose: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalRoleIcon, isUser && styles.modalUserRoleIcon]}>
              {isUser ? (
                <UserIcon size={18} color={colors.text.primary} />
              ) : (
                <Bot size={18} color={colors.accent.violet} />
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
            <Text style={styles.modalContent} selectable>
              {message.content}
            </Text>

            {/* Meta info */}
            {(message.costUSD || message.modelUsed) && (
              <View style={styles.modalMeta}>
                {message.costUSD !== undefined && message.costUSD > 0 && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>${message.costUSD.toFixed(4)}</Text>
                  </View>
                )}
                {message.modelUsed && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{message.modelUsed.split("/").pop()}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Push Status constants
const PUSH_STATUSES: GitHubPushStatus[] = ["pending", "in_progress", "completed", "failed"];

const PUSH_STATUS_CONFIG: Record<GitHubPushStatus, { color: string; label: string }> = {
  pending: { color: colors.accent.amber, label: "Pending" },
  in_progress: { color: colors.accent.sky, label: "In Progress" },
  completed: { color: colors.accent.emerald, label: "Completed" },
  failed: { color: colors.accent.rose, label: "Failed" },
};

// Push Status Selection Modal
function PushStatusModal({
  visible,
  currentStatus,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentStatus: GitHubPushStatus | undefined;
  onSave: (status: GitHubPushStatus) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pushModalOverlay}>
        <View style={styles.pushModalContainer}>
          <View style={styles.pushModalHeader}>
            <Text style={styles.pushModalTitle}>Change Push Status</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pushStatusList}>
            {PUSH_STATUSES.map((status) => {
              const config = PUSH_STATUS_CONFIG[status];
              const isSelected = currentStatus === status;

              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.pushStatusOption, isSelected && styles.pushStatusOptionSelected]}
                  onPress={() => {
                    onSave(status);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pushStatusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.pushStatusOptionText, isSelected && styles.pushStatusOptionTextSelected]}>
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

// Session Status constants - common ones for easy selection
const SESSION_STATUSES: SessionStatus[] = [
  "RUNNING",
  "PUSH_COMPLETE",
  "PUSH_FAILED",
  "IN_PROGRESS",
  "PUSHING_TO_GITHUB",
  "AUTO_PUSHING",
];

const SESSION_STATUS_CONFIG: Record<SessionStatus, { color: string; label: string }> = {
  IN_PROGRESS: { color: colors.accent.sky, label: "In Progress" },
  CLONING_REPO: { color: colors.accent.sky, label: "Cloning Repo" },
  INSTALLING_DEPENDENCIES: { color: colors.accent.sky, label: "Installing Dependencies" },
  STARTING_DEV_SERVER: { color: colors.accent.sky, label: "Starting Dev Server" },
  CREATING_TUNNEL: { color: colors.accent.sky, label: "Creating Tunnel" },
  CUSTOM: { color: colors.accent.violet, label: "Custom" },
  RUNNING: { color: colors.accent.emerald, label: "Running" },
  CREATING_GITHUB_REPO: { color: colors.accent.sky, label: "Creating GitHub Repo" },
  SETTING_UP_SANDBOX: { color: colors.accent.sky, label: "Setting Up Sandbox" },
  INITIALIZING_GIT: { color: colors.accent.sky, label: "Initializing Git" },
  ADDING_FILES: { color: colors.accent.sky, label: "Adding Files" },
  COMMITTING_CHANGES: { color: colors.accent.sky, label: "Committing Changes" },
  PUSHING_TO_GITHUB: { color: colors.accent.amber, label: "Pushing to GitHub" },
  PUSH_COMPLETE: { color: colors.accent.emerald, label: "Push Complete" },
  PUSH_FAILED: { color: colors.accent.rose, label: "Push Failed" },
  AUTO_PUSHING: { color: colors.accent.amber, label: "Auto Pushing" },
  USING_EXISTING_REPO: { color: colors.accent.violet, label: "Using Existing Repo" },
};

// Session Status Selection Modal
function SessionStatusModal({
  visible,
  currentStatus,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentStatus: SessionStatus | undefined;
  onSave: (status: SessionStatus) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.pushModalOverlay}>
        <View style={styles.pushModalContainer}>
          <View style={styles.pushModalHeader}>
            <Text style={styles.pushModalTitle}>Change Session Status</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pushStatusList}>
              {SESSION_STATUSES.map((status) => {
                const config = SESSION_STATUS_CONFIG[status];
                const isSelected = currentStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.pushStatusOption, isSelected && styles.pushStatusOptionSelected]}
                    onPress={() => {
                      onSave(status);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pushStatusDot, { backgroundColor: config.color }]} />
                    <Text style={[styles.pushStatusOptionText, isSelected && styles.pushStatusOptionTextSelected]}>
                      {config.label}
                    </Text>
                    {isSelected && <Check size={16} color={colors.accent.emerald} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Chat Message Bubble Component
function ChatMessage({
  message,
  onPress,
}: {
  message: Message;
  onPress: () => void;
}) {
  const isUser = message.role === "user";
  const isLong = message.content.length > 200;

  return (
    <TouchableOpacity
      style={[styles.chatRow, isUser && styles.chatRowUser]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Assistant avatar on left */}
      {!isUser && (
        <View style={styles.chatAvatar}>
          <Bot size={14} color={colors.accent.violet} />
        </View>
      )}

      <View
        style={[
          styles.chatBubble,
          isUser ? styles.userChatBubble : styles.assistantChatBubble,
        ]}
      >
        <Text
          style={[styles.chatContent, isUser && styles.userChatContent]}
          numberOfLines={isLong ? 6 : undefined}
        >
          {message.content}
        </Text>

        {/* Show expand hint for long messages */}
        {isLong && (
          <Text style={styles.expandHint}>Tap to read more...</Text>
        )}

        {/* Cost & Model for assistant */}
        {!isUser && (message.costUSD || message.modelUsed) && (
          <View style={styles.chatMeta}>
            {message.costUSD !== undefined && message.costUSD > 0 && (
              <Text style={styles.chatMetaText}>${message.costUSD.toFixed(4)}</Text>
            )}
            {message.modelUsed && (
              <Text style={styles.chatMetaText}>
                {message.modelUsed.split("/").pop()}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* User avatar on right */}
      {isUser && (
        <View style={[styles.chatAvatar, styles.userAvatar]}>
          <UserIcon size={14} color={colors.text.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Created By Row (clickable, shows name)
function CreatedByRow({
  creatorId,
  users,
  onPress,
}: {
  creatorId: string;
  users: User[] | undefined;
  onPress: () => void;
}) {
  const creator = users?.find((u) => u._id === creatorId || u.clerkId === creatorId);
  const displayName = getDisplayName(creator);

  return (
    <TouchableOpacity
      style={styles.detailRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.detailIcon}>
        <UserIcon size={14} color={colors.text.muted} />
      </View>
      <Text style={styles.detailLabel}>Created By</Text>
      <View style={styles.detailValueWrap}>
        <Text style={[styles.detailValue, styles.linkValue]} numberOfLines={1}>
          {displayName}
        </Text>
        <ChevronRight size={14} color={colors.accent.sky} />
      </View>
    </TouchableOpacity>
  );
}

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isResuming, setIsResuming] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [pushStatusModalVisible, setPushStatusModalVisible] = useState(false);
  const [sessionStatusModalVisible, setSessionStatusModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => fetchMessages(sessionId),
    enabled: !!sessionId,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const session = sessions?.find((s) => s._id === sessionId);

  // Sort messages: oldest first (so newest at bottom like chat apps)
  // Use createdAt if available, fallback to _creationTime
  const sortedMessages = messages
    ? [...messages].sort((a, b) => {
        const timeA = a.createdAt ?? a._creationTime;
        const timeB = b.createdAt ?? b._creationTime;
        return timeA - timeB;
      })
    : [];

  // Calculate session stats from messages
  const sessionStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return {
        totalCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalDurationMs: 0,
        modelBreakdown: {} as Record<string, number>,
      };
    }

    let totalCost = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;
    let totalDurationMs = 0;
    const modelBreakdown: Record<string, number> = {};

    for (const msg of messages) {
      if (msg.costUSD) totalCost += msg.costUSD;
      if (msg.inputTokens) inputTokens += msg.inputTokens;
      if (msg.outputTokens) outputTokens += msg.outputTokens;
      if (msg.cacheReadTokens) cacheReadTokens += msg.cacheReadTokens;
      if (msg.cacheCreationTokens) cacheCreationTokens += msg.cacheCreationTokens;
      if (msg.durationMs) totalDurationMs += msg.durationMs;
      if (msg.modelUsed && msg.costUSD) {
        const modelName = msg.modelUsed.split("/").pop() || msg.modelUsed;
        modelBreakdown[modelName] = (modelBreakdown[modelName] || 0) + msg.costUSD;
      }
    }

    return {
      totalCost,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheCreationTokens,
      totalDurationMs,
      modelBreakdown,
    };
  }, [messages]);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const handleUserPress = () => {
    if (session?.createdBy) {
      router.push(`/(tabs)/(users)/${session.createdBy}`);
    }
  };

  const handleOpenInExpo = async () => {
    if (!session?.tunnelUrl) return;

    setIsResuming(true);
    try {
      const result = await resumeSandbox(session.tunnelUrl);
      if (result.success && result.appUrl) {
        const expoUrl = result.appUrl.replace(/^https?:\/\//, "exp://");
        await Linking.openURL(expoUrl);
      } else {
        const errorMsg =
          result.error?.includes("404") || result.error?.includes("not found")
            ? "Sandbox has expired or was deleted. Please create a new session."
            : result.error || "Failed to resume sandbox. Please try again.";
        Alert.alert("Error", errorMsg);
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsResuming(false);
    }
  };

  const handleSavePushStatus = async (status: GitHubPushStatus) => {
    if (!sessionId) return;
    setIsUpdating(true);

    const success = await updateSessionPushStatus(sessionId, status);

    setIsUpdating(false);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      Alert.alert("Success", "Push status updated successfully");
    } else {
      Alert.alert("Error", "Failed to update push status");
    }
  };

  const handleSaveSessionStatus = async (status: SessionStatus) => {
    if (!sessionId) return;
    setIsUpdating(true);

    const success = await updateSessionStatus(sessionId, status);

    setIsUpdating(false);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      Alert.alert("Success", "Session status updated successfully");
    } else {
      Alert.alert("Error", "Failed to update session status");
    }
  };

  if (loadingSessions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.text.tertiary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconLarge}>
            <Terminal size={28} color={colors.text.secondary} strokeWidth={1.5} />
          </View>
          <Text style={styles.sessionName}>{session.name}</Text>
        </View>

        {/* Open in Expo Button */}
        {session.tunnelUrl && (
          <TouchableOpacity
            style={[styles.expoButton, isResuming && styles.expoButtonDisabled]}
            onPress={handleOpenInExpo}
            disabled={isResuming}
            activeOpacity={0.7}
          >
            {isResuming ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Play size={18} color={colors.text.inverse} fill={colors.text.inverse} />
            )}
            <Text style={styles.expoButtonText}>
              {isResuming ? "Resuming..." : "Open in Expo"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Session Info Section */}
        <Section title="Session Info">
          <DetailRow label="Template" value={session.templateId} mono />
          <DetailRow
            label="Status"
            value={SESSION_STATUS_CONFIG[session.status]?.label || session.status}
            valueColor={SESSION_STATUS_CONFIG[session.status]?.color}
            onEdit={() => setSessionStatusModalVisible(true)}
          />
          {session.createdBy && (
            <CreatedByRow
              creatorId={session.createdBy}
              users={users}
              onPress={handleUserPress}
            />
          )}
          <DetailRow
            label="Created"
            value={formatDate(session._creationTime)}
            icon={<Calendar size={14} color={colors.text.muted} />}
          />
        </Section>

        {/* Costs & Usage Section */}
        <Section title="Costs & Usage">
          <DetailRow
            label="Total Cost (Real)"
            value={
              sessionStats.totalCost > 0
                ? formatCurrency(sessionStats.totalCost)
                : session.totalCostUSD !== undefined
                ? formatCurrency(session.totalCostUSD)
                : "—"
            }
            icon={<DollarSign size={14} color={colors.accent.emerald} />}
          />
          <DetailRow
            label="Messages"
            value={messages?.length ?? session.messageCount ?? 0}
            icon={<MessageSquare size={14} color={colors.accent.sky} />}
          />
          {sessionStats.inputTokens > 0 && (
            <DetailRow
              label="Input Tokens"
              value={formatNumber(sessionStats.inputTokens)}
              icon={<TrendingUp size={14} color={colors.accent.violet} />}
            />
          )}
          {sessionStats.outputTokens > 0 && (
            <DetailRow
              label="Output Tokens"
              value={formatNumber(sessionStats.outputTokens)}
              icon={<Zap size={14} color={colors.accent.amber} />}
            />
          )}
          {sessionStats.cacheReadTokens > 0 && (
            <DetailRow
              label="Cache Read"
              value={formatNumber(sessionStats.cacheReadTokens)}
              icon={<Cpu size={14} color={colors.text.muted} />}
            />
          )}
          {sessionStats.cacheCreationTokens > 0 && (
            <DetailRow
              label="Cache Created"
              value={formatNumber(sessionStats.cacheCreationTokens)}
              icon={<Cpu size={14} color={colors.text.muted} />}
            />
          )}
          {sessionStats.totalDurationMs > 0 && (
            <DetailRow
              label="Total Duration"
              value={formatDuration(sessionStats.totalDurationMs)}
              icon={<Clock size={14} color={colors.text.muted} />}
            />
          )}
        </Section>

        {/* Model Breakdown Section */}
        {Object.keys(sessionStats.modelBreakdown).length > 0 && (
          <Section title="Cost by Model" defaultOpen={false}>
            {Object.entries(sessionStats.modelBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([model, cost]) => (
                <DetailRow
                  key={model}
                  label={model}
                  value={formatCurrency(cost)}
                  icon={<Cpu size={14} color={colors.accent.violet} />}
                />
              ))}
          </Section>
        )}

        {/* URLs Section */}
        {session.tunnelUrl && (
          <Section title="URLs">
            <DetailRow
              label="Tunnel URL"
              value={session.tunnelUrl}
              icon={<Globe size={14} color={colors.accent.sky} />}
              isLink
            />
          </Section>
        )}

        {/* GitHub Section */}
        {session.githubRepository && (
          <Section title="GitHub">
            <DetailRow
              label="Repository"
              value={session.githubRepository}
              icon={<Github size={14} color={colors.text.secondary} />}
            />
            {session.githubRepositoryUrl && (
              <DetailRow label="URL" value={session.githubRepositoryUrl} isLink />
            )}
            <DetailRow
              label="Push Status"
              value={session.githubPushStatus ? PUSH_STATUS_CONFIG[session.githubPushStatus]?.label : "Not set"}
              valueColor={session.githubPushStatus ? PUSH_STATUS_CONFIG[session.githubPushStatus]?.color : colors.text.muted}
              onEdit={() => setPushStatusModalVisible(true)}
            />
          </Section>
        )}

        {/* Convex Project Section */}
        {session.convexProject && (
          <Section title="Convex Project">
            <DetailRow
              label="Deployment"
              value={session.convexProject.deploymentName}
              icon={<Database size={14} color={colors.accent.amber} />}
              mono
            />
            <DetailRow
              label="URL"
              value={session.convexProject.deploymentUrl}
              isLink
            />
          </Section>
        )}

        {/* Environment Variables Section */}
        {session.envs && Object.keys(session.envs).length > 0 && (
          <Section title="Environment Variables" defaultOpen={false}>
            <View style={styles.envContainer}>
              {Object.entries(session.envs).map(([key, value]) => (
                <EnvVarRow key={key} name={key} value={value} />
              ))}
            </View>
          </Section>
        )}

        {/* Messages Section - Chat Style */}
        <Section title="Messages" count={messages?.length} defaultOpen={true}>
          <View style={styles.messagesContainer}>
            {loadingMessages ? (
              <View style={styles.messagesLoading}>
                <ActivityIndicator size="small" color={colors.text.tertiary} />
              </View>
            ) : sortedMessages.length > 0 ? (
              <View style={styles.chatContainer}>
                {sortedMessages.map((msg) => (
                  <ChatMessage
                    key={msg._id}
                    message={msg}
                    onPress={() => setSelectedMessage(msg)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noMessages}>
                <Text style={styles.noMessagesText}>No messages yet</Text>
              </View>
            )}
          </View>
        </Section>
      </ScrollView>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}

      {/* Push Status Modal */}
      <PushStatusModal
        visible={pushStatusModalVisible}
        currentStatus={session?.githubPushStatus}
        onSave={handleSavePushStatus}
        onClose={() => setPushStatusModalVisible(false)}
      />

      {/* Session Status Modal */}
      <SessionStatusModal
        visible={sessionStatusModalVisible}
        currentStatus={session?.status}
        onSave={handleSaveSessionStatus}
        onClose={() => setSessionStatusModalVisible(false)}
      />

      {/* Updating Overlay */}
      {isUpdating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator size="small" color={colors.text.primary} />
          <Text style={styles.updatingText}>Updating...</Text>
        </View>
      )}
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
  header: {
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  iconLarge: {
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
  sessionName: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  expoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg.accent,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  expoButtonDisabled: {
    opacity: 0.6,
  },
  expoButtonText: {
    ...typography.bodyMedium,
    color: colors.text.inverse,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.muted,
    flex: 1,
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
  linkValue: {
    color: colors.accent.sky,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  envContainer: {
    padding: spacing.lg,
  },
  envRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  envName: {
    ...typography.mono,
    color: colors.accent.emerald,
  },
  envValue: {
    ...typography.mono,
    color: colors.text.tertiary,
    maxWidth: "50%",
  },
  messagesContainer: {
    padding: spacing.sm,
  },
  messagesLoading: {
    padding: spacing.xl,
    alignItems: "center",
  },
  chatContainer: {
    gap: spacing.md,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  chatRowUser: {
    justifyContent: "flex-end",
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: `${colors.accent.violet}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  userAvatar: {
    backgroundColor: `${colors.accent.sky}20`,
  },
  chatBubble: {
    maxWidth: "75%",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  userChatBubble: {
    backgroundColor: colors.accent.sky,
    borderBottomRightRadius: radius.xs,
  },
  assistantChatBubble: {
    backgroundColor: colors.bg.tertiary,
    borderBottomLeftRadius: radius.xs,
  },
  chatContent: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 18,
  },
  userChatContent: {
    color: colors.text.inverse,
  },
  expandHint: {
    ...typography.small,
    color: colors.text.muted,
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  chatMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  chatMetaText: {
    ...typography.small,
    color: colors.text.muted,
    fontSize: 10,
  },
  noMessages: {
    padding: spacing.xl,
    alignItems: "center",
  },
  noMessagesText: {
    ...typography.caption,
    color: colors.text.muted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.md,
  },
  modalRoleIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: `${colors.accent.violet}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  modalUserRoleIcon: {
    backgroundColor: `${colors.accent.sky}20`,
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
  modalContent: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  modalMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    flexWrap: "wrap",
  },
  metaBadge: {
    backgroundColor: colors.bg.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  metaText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  // Detail edit button
  detailEditBtn: {
    padding: spacing.xs,
  },
  // Push Status Modal styles
  pushModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  pushModalContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    width: "100%",
    maxWidth: 360,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pushModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  pushModalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  pushStatusList: {
    gap: spacing.sm,
  },
  pushStatusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pushStatusOptionSelected: {
    borderColor: colors.accent.emerald,
    backgroundColor: `${colors.accent.emerald}10`,
  },
  pushStatusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  pushStatusOptionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  pushStatusOptionTextSelected: {
    color: colors.text.primary,
  },
  // Updating overlay
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
});
