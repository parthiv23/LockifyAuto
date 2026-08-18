import type { HistoryEvent as BackendHistoryEvent } from "@shared/schema";
import { apiRequest } from "./queryClient";

type HistoryEventType =
  | "login"
  | "logout"
  | "register"
  | "record: create"
  | "record: update"
  | "record: delete"
  | "record: restore"
  | "record: toggleStar"
  | "trash: empty"
  | "trash: autoDelete";

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  timestamp: number;
  summary: string;
  details?: Record<string, unknown>;
  userId?: string;
}

function getAuthSession(): { userId: string; token: string } | null {
  try {
    const raw = localStorage.getItem("lockify-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const userId = parsed?.user?.id || parsed?.user?.username || null;
    const token = parsed?.token;
    if (typeof userId !== "string" || !userId) return null;
    if (typeof token !== "string" || !token) return null;
    return { userId, token };
  } catch {
    return null;
  }
}

function getCurrentUserId(): string | null {
  return getAuthSession()?.userId ?? null;
}

function dispatchUpdate(): void {
  try {
    window.dispatchEvent(new Event("lockify-history-updated" as any));
  } catch {}
}

export const history = {
  async add(event: Omit<HistoryEvent, "id" | "timestamp"> & { timestamp?: number }): Promise<HistoryEvent | null> {
    // Snapshot before any await so logout can clear the session immediately after.
    const session = getAuthSession();
    if (!session) return null;

    const timestamp = event.timestamp ?? Date.now();

    try {
      const res = await apiRequest(
        "POST",
        "/api/history",
        {
          userId: session.userId,
          type: event.type,
          summary: event.summary,
          details: event.details ? JSON.stringify(event.details) : undefined,
          timestamp: new Date(timestamp).toISOString(),
        },
        { token: session.token },
      );

      if (!res.ok) throw new Error("Failed to save history");

      const saved = (await res.json()) as BackendHistoryEvent;
      const newEvent: HistoryEvent = {
        id: saved.id,
        type: saved.type as HistoryEventType,
        timestamp: new Date(saved.timestamp as unknown as string).getTime(),
        summary: saved.summary,
        details: saved.details ? JSON.parse(String(saved.details)) : undefined,
        userId: saved.userId,
      };
      
      // Notify listeners that history was updated
      dispatchUpdate();
      
      return newEvent;
    } catch (error) {
      console.error("Failed to save history:", error);
      return null;
    }
  },

  async list(): Promise<HistoryEvent[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    try {
      const res = await apiRequest("GET", "/api/history");
      if (!res.ok) return [];
      const data = (await res.json()) as BackendHistoryEvent[];
      const events: HistoryEvent[] = data.map((raw) => ({
        id: raw.id,
        type: raw.type as HistoryEventType,
        timestamp: new Date(raw.timestamp as unknown as string).getTime(),
        summary: raw.summary,
        details: raw.details ? JSON.parse(String(raw.details)) : undefined,
        userId: raw.userId,
      }));
      return events.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  },

  async clear(): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const res = await apiRequest("DELETE", "/api/history");
      if (!res.ok) throw new Error("Failed to clear history");
      
      // Notify listeners
      dispatchUpdate();
    } catch (error) {
      console.error("Failed to clear history:", error);
      throw error;
    }
  },
};

export type { HistoryEventType };




