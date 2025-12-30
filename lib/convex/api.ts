import type {
  User,
  Session,
  Message,
  PaymentTransaction,
  GlobalConfig,
  AdminStats,
  SubscriptionPlan,
  AgentType,
  ConvexProjectCredentials,
  GitHubCredentials,
  GitHubPushStatus,
  SessionStatus,
} from "@/lib/types/admin";

const BASE_URL = "https://avid-cat-678.convex.site";
const ADMIN_SECRET = "sahnddoski";

async function adminGet<T>(endpoint: string): Promise<T | null> {
  console.log(`[Admin] GET ${endpoint}`);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
      },
    });

    const text = await response.text();
    console.log(`[Admin] ${endpoint} status:`, response.status);

    if (!response.ok) {
      console.log(`[Admin] ${endpoint} error:`, text);
      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    console.log(`[Admin] ${endpoint} error:`, error);
    return null;
  }
}

async function adminPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
  console.log(`[Admin] POST ${endpoint}`, body);
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(`[Admin] ${endpoint} status:`, response.status);

    if (!response.ok) {
      console.log(`[Admin] ${endpoint} error:`, text);
      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    console.log(`[Admin] ${endpoint} error:`, error);
    return null;
  }
}

export async function fetchUsers(): Promise<User[]> {
  const result = await adminGet<{ users: User[]; total: number; hasMore: boolean }>("/admin/users");
  return result?.users || [];
}

export async function fetchUserStats(): Promise<AdminStats | null> {
  const result = await adminGet<{
    total: number;
    byPlan: Record<string, number>;
    byAgentType: Record<string, number>;
    totalCreditsUSD: number;
  }>("/admin/stats");

  if (!result) return null;

  return {
    totalUsers: result.total,
    activeSubscriptions: (result.byPlan?.pro || 0) + (result.byPlan?.business || 0) + (result.byPlan?.enterprise || 0),
    totalSessions: 0,
    runningSessions: 0,
    totalRevenue: result.totalCreditsUSD || 0,
    totalMessages: 0,
  };
}

export async function fetchSessions(): Promise<Session[]> {
  const result = await adminGet<{ sessions: Session[]; total: number; hasMore: boolean }>("/admin/sessions");
  return result?.sessions || [];
}

export async function fetchPayments(): Promise<PaymentTransaction[]> {
  const result = await adminGet<{ transactions: PaymentTransaction[]; total: number; hasMore: boolean }>("/admin/transactions");
  return result?.transactions || [];
}

export async function fetchGlobalConfig(): Promise<GlobalConfig[]> {
  const result = await adminGet<{ agentType: string; updatedAt: number }>("/admin/config");
  if (!result) return [];

  return [{
    _id: "config",
    _creationTime: result.updatedAt,
    key: "agentType",
    value: result.agentType,
    updatedAt: result.updatedAt,
  }];
}

export async function fetchConvexCredentials(): Promise<ConvexProjectCredentials[]> {
  const result = await adminGet<{ credentials: ConvexProjectCredentials[] }>("/admin/convex-credentials");
  return result?.credentials || [];
}

export async function fetchGitHubCredentials(): Promise<GitHubCredentials[]> {
  const result = await adminGet<{ credentials: GitHubCredentials[] }>("/admin/github-credentials");
  return result?.credentials || [];
}

export async function fetchMessages(sessionId?: string, limit = 100, offset = 0): Promise<Message[]> {
  let endpoint = `/admin/messages?limit=${limit}&offset=${offset}`;
  if (sessionId) {
    endpoint += `&sessionId=${sessionId}`;
  }
  const result = await adminGet<{ messages: Message[]; total: number; hasMore: boolean }>(endpoint);
  const messages = result?.messages || [];
  // Filter out messages with empty or whitespace-only content
  return messages.filter((msg) => msg.content && msg.content.trim().length > 0);
}

export async function setUserCredits(userId: string, creditsUSD: number): Promise<boolean> {
  const result = await adminPost("/admin/user/credits", { userId, creditsUSD });
  return result !== null;
}

export async function setUserMessages(userId: string, messagesRemaining: number): Promise<boolean> {
  const result = await adminPost("/admin/user/messages", { userId, messagesRemaining });
  return result !== null;
}

export async function setUserPlan(
  userId: string,
  subscriptionPlan: SubscriptionPlan,
  resetMessages = true
): Promise<boolean> {
  const result = await adminPost("/admin/user/update", {
    userId,
    updates: { subscriptionPlan, resetMessages }
  });
  return result !== null;
}

export async function setGlobalAgentType(agentType: AgentType): Promise<boolean> {
  const result = await adminPost("/admin/config/agent-type", { agentType });
  return result !== null;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await adminPost("/admin/user/delete", { userId });
  return result !== null;
}

export async function updateSessionPushStatus(
  sessionId: string,
  githubPushStatus: GitHubPushStatus
): Promise<boolean> {
  const result = await adminPost("/admin/session/update", {
    sessionId,
    updates: { githubPushStatus },
  });
  return result !== null;
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<boolean> {
  const result = await adminPost("/admin/session/update", {
    sessionId,
    updates: { status },
  });
  return result !== null;
}

export interface ResumeSandboxResult {
  success: boolean;
  sandboxId?: string;
  appUrl?: string;
  timeoutMs?: number;
  error?: string;
}

export async function resumeSandbox(sandboxIdOrUrl: string, timeoutMs = 600000): Promise<ResumeSandboxResult> {
  const result = await adminPost<ResumeSandboxResult>("/admin/sandbox/resume", { sandboxIdOrUrl, timeoutMs });
  if (!result) {
    return { success: false, error: "Request failed" };
  }
  return result;
}

export async function fixMissingUserFields(): Promise<boolean> {
  const result = await adminPost("/admin/fix-users", {});
  return result !== null;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const stats = await fetchUserStats();
  if (stats) return stats;

  return {
    totalUsers: 0,
    activeSubscriptions: 0,
    totalSessions: 0,
    runningSessions: 0,
    totalRevenue: 0,
    totalMessages: 0,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}...`;
}
