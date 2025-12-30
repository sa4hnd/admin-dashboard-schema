export type SubscriptionPlan = "free" | "weekly_plus" | "pro" | "business" | "enterprise";
export type MigrationStatus = "pending" | "in_progress" | "completed" | "failed";
export type AgentType = "cursor" | "claude" | "gemini";
export type BillingMode = "tokens" | "credits";

export interface User {
  _id: string;
  _creationTime: number;
  clerkId: string;
  // User profile info from Clerk
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  imageUrl?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionId?: string;
  subscriptionStatus?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  migrationDate?: number;
  migrationStatus?: MigrationStatus;
  accessExpiresAt?: number;
  billingPeriodEnd?: number;
  isCanceled?: boolean;
  cancellationDate?: number;
  isTrialPeriod?: boolean;
  willRenew?: boolean;
  originalProductId?: string;
  lastGrantedTransactionId?: string;
  messagesRemaining?: number;
  messagesUsed?: number;
  lastMessageReset?: number;
  agentType?: AgentType;
  billingMode?: BillingMode;
  creditsUSD?: number;
  creditsUsed?: number;
  totalPaidUSD?: number;
  realCostUSD?: number;
  profitUSD?: number;
  lastCostUpdate?: number;
  lastPaymentDate?: number;
  notificationsEnabled?: boolean;
  pushToken?: string;
}

export type SessionStatus =
  | "IN_PROGRESS"
  | "CLONING_REPO"
  | "INSTALLING_DEPENDENCIES"
  | "STARTING_DEV_SERVER"
  | "CREATING_TUNNEL"
  | "CUSTOM"
  | "RUNNING"
  | "CREATING_GITHUB_REPO"
  | "SETTING_UP_SANDBOX"
  | "INITIALIZING_GIT"
  | "ADDING_FILES"
  | "COMMITTING_CHANGES"
  | "PUSHING_TO_GITHUB"
  | "PUSH_COMPLETE"
  | "PUSH_FAILED"
  | "AUTO_PUSHING"
  | "USING_EXISTING_REPO";

export type GitHubPushStatus = "pending" | "in_progress" | "completed" | "failed";

export interface ConvexProject {
  deploymentName: string;
  deploymentUrl: string;
  adminKey: string;
  projectSlug?: string;
  teamSlug?: string;
}

export interface Session {
  _id: string;
  _creationTime: number;
  createdBy?: string;
  sessionId?: string;
  name: string;
  tunnelUrl?: string;
  repository?: string;
  templateId: string;
  pullRequest?: unknown;
  githubRepository?: string;
  githubRepositoryUrl?: string;
  githubPushStatus?: GitHubPushStatus;
  githubPushDate?: number;
  status: SessionStatus;
  statusMessage?: string;
  totalCostUSD?: number;
  messageCount?: number;
  lastCostUpdate?: number;
  envs?: Record<string, string>;
  convexProject?: ConvexProject;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  _id: string;
  _creationTime: number;
  sessionId: string;
  role: MessageRole;
  content: string;
  edits?: { filePath: string; oldString: string; newString: string };
  todos?: { id: string; content: string; status: string; priority: string }[];
  read?: { filePath: string };
  bash?: { command: string; output?: string; exitCode?: number };
  webSearch?: { query: string; results?: string };
  mcpTool?: { toolName: string; input?: unknown; output?: unknown; status?: string };
  tool?: { toolName: string; command?: string; output?: string; exitCode?: number; status?: string };
  codebaseSearch?: { query: string; results?: string; targetDirectories?: string[] };
  grep?: { pattern: string; filePath: string; matches?: string[]; lineCount?: number };
  searchReplace?: { filePath: string; oldString: string; newString: string; replacements?: number };
  image?: { fileName: string; path: string; storageId?: string };
  checkpoint?: { branch: string; patch?: string };
  costUSD?: number;
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  durationMs?: number;
  createdAt?: number;
}

export type PaymentType = "payment" | "refund" | "chargeback" | "adjustment" | "subscription_change" | "failed_payment";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "disputed";

export interface PaymentTransaction {
  _id: string;
  _creationTime: number;
  userId: string;
  transactionId: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: unknown;
  messagesAdded?: number;
  subscriptionPlan?: string;
  processedAt: number;
  createdAt: number;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  stripeSessionId?: string;
}

export interface GlobalConfig {
  _id: string;
  _creationTime: number;
  key: string;
  value: string;
  updatedAt: number;
  updatedBy?: string;
}

export interface ConvexProjectCredentials {
  _id: string;
  _creationTime: number;
  userId: string;
  projectSlug: string;
  teamSlug: string;
  projectDeployKey: string;
  createdAt: number;
}

export interface GitHubCredentials {
  _id: string;
  _creationTime: number;
  clerkId: string;
  accessToken: string;
  username: string;
  connectedAt: number;
  updatedAt: number;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalSessions: number;
  runningSessions: number;
  totalRevenue: number;
  totalMessages: number;
}
