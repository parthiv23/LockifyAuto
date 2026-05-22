import type * as Schema from "../shared/schema.ts";

type User = Schema.User;
type InsertUser = Schema.InsertUser;
type PasswordRecord = Schema.PasswordRecord;
type InsertPasswordRecord = Schema.InsertPasswordRecord;
type HistoryEvent = Schema.HistoryEvent;
type InsertHistoryEvent = Schema.InsertHistoryEvent;
import bcrypt from "bcryptjs";
import dns from "node:dns";
import { MongoClient, ServerApiVersion } from "mongodb";

// Node 22+ on Windows can fail mongodb+srv SRV DNS lookups (querySrv ECONNREFUSED)
if (process.platform === "win32") {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnboarding(userId: string, hasCompletedOnboarding: boolean): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Password record methods
  getPasswordRecords(userId: string): Promise<PasswordRecord[]>;
  getPasswordRecord(id: string, userId: string): Promise<PasswordRecord | undefined>;
  createPasswordRecord(record: InsertPasswordRecord & { userId: string }): Promise<PasswordRecord>;
  updatePasswordRecord(id: string, record: Partial<InsertPasswordRecord>, userId: string): Promise<PasswordRecord | undefined>;
  deletePasswordRecord(id: string, userId: string): Promise<boolean>;
  
  // History methods
  getHistoryEvents(userId: string): Promise<HistoryEvent[]>;
  createHistoryEvent(event: InsertHistoryEvent & { userId: string }): Promise<HistoryEvent>;
  deleteHistoryEvents(userId: string): Promise<number>;
}

// Mongo-backed storage
class MongoStorage implements IStorage {
  private client: MongoClient;
  private ready: Promise<void>;
  private dbName: string;

  constructor(uri: string) {
    this.client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
    const url = new URL(uri);
    // mongodb+srv doesn't include db in pathname reliably, allow override via env
    this.dbName = process.env.MONGO_DB_NAME || (url.pathname.replace(/^\//, "") || "recordDB");
    this.ready = this.client.connect().then(() => this.ensureIndexes());
  }

  async connect(): Promise<void> {
    await this.ready;
  }

  private async ensureIndexes() {
    const db = this.client.db(this.dbName);
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("password_records").createIndex({ userId: 1 });
    await db.collection("history_events").createIndex({ userId: 1 });
    await db.collection("history_events").createIndex({ timestamp: -1 });
  }

  private async getDb() {
    await this.ready;
    return this.client.db(this.dbName);
  }

  async getUser(id: string): Promise<User | undefined> {
    const db = await this.getDb();
    const u = await db.collection<User>("users").findOne({ id });
    return u || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDb();
    const u = await db.collection<User>("users").findOne({ username });
    return u || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      hasCompletedOnboarding: false,
      createdAt: new Date(),
      ...(insertUser.profileimage ? { profileimage: insertUser.profileimage } : {}),
    } as unknown as User;
    await db.collection<User>("users").insertOne(user);
    return user;
  }

  async getPasswordRecords(userId: string): Promise<PasswordRecord[]> {
    const db = await this.getDb();
    return db.collection<PasswordRecord>("password_records").find({ userId }).toArray();
  }

  async getPasswordRecord(id: string, userId: string): Promise<PasswordRecord | undefined> {
    const db = await this.getDb();
    const r = await db.collection<PasswordRecord>("password_records").findOne({ id, userId });
    return r || undefined;
  }

  async createPasswordRecord(record: InsertPasswordRecord & { userId: string }): Promise<PasswordRecord> {
    const db = await this.getDb();
    const now = new Date();
    const rec: PasswordRecord = {
      id: crypto.randomUUID(),
      userId: record.userId,
      email: record.email,
      password: record.password,
      description: record.description || null,
      userType: (record as any).userType || "gmail",
      starred: (record as any).starred ?? false,
      isDeleted: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    } as unknown as PasswordRecord;
    await db.collection<PasswordRecord>("password_records").insertOne(rec);
    return rec;
  }

  async updatePasswordRecord(id: string, record: Partial<InsertPasswordRecord>, userId: string): Promise<PasswordRecord | undefined> {
    const db = await this.getDb();
    const existing = await db.collection<PasswordRecord>("password_records").findOne({ id, userId });
    if (!existing) return undefined;
    const updated: PasswordRecord = { ...(existing as any), ...(record as any), updatedAt: new Date() } as PasswordRecord;
    await db.collection<PasswordRecord>("password_records").updateOne({ id, userId }, { $set: updated });
    return updated;
  }

  async deletePasswordRecord(id: string, userId: string): Promise<boolean> {
    const db = await this.getDb();
    const res = await db.collection<PasswordRecord>("password_records").deleteOne({ id, userId });
    return res.deletedCount === 1;
  }

  async updateUserOnboarding(userId: string, hasCompletedOnboarding: boolean): Promise<User | undefined> {
    const db = await this.getDb();
    const res = await db.collection<User>("users").findOneAndUpdate(
      { id: userId },
      { $set: { hasCompletedOnboarding } },
      { returnDocument: "after" },
    );
    return res.value || undefined;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const db = await this.getDb();
    // Delete user document
    const userResult = await db.collection<User>("users").deleteOne({ id: userId });
    // Also delete related password records and history events for safety.
    // Note: in a relational setup, these would typically be handled via FK cascade.
    await db.collection<PasswordRecord>("password_records").deleteMany({ userId });
    await db.collection<HistoryEvent>("history_events").deleteMany({ userId });
    return userResult.deletedCount === 1;
  }

  async getHistoryEvents(userId: string): Promise<HistoryEvent[]> {
    const db = await this.getDb();
    return db.collection<HistoryEvent>("history_events")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(300)
      .toArray();
  }

  async createHistoryEvent(event: InsertHistoryEvent & { userId: string }): Promise<HistoryEvent> {
    const db = await this.getDb();
    const historyEvent: HistoryEvent = {
      id: crypto.randomUUID(),
      userId: event.userId,
      type: event.type,
      summary: event.summary,
      details: event.details || null,
      timestamp: event.timestamp,
      createdAt: new Date(),
    } as unknown as HistoryEvent;
    await db.collection<HistoryEvent>("history_events").insertOne(historyEvent);
    return historyEvent;
  }

  async deleteHistoryEvents(userId: string): Promise<number> {
    const db = await this.getDb();
    const result = await db.collection<HistoryEvent>("history_events").deleteMany({ userId });
    return result.deletedCount;
  }
}

export let storage!: IStorage;

export async function initStorage(): Promise<void> {
  const mongoUri = (process.env.MONGO_URI || "").trim();
  if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    throw new Error(
      "MONGO_URI is required. Set a valid mongodb:// or mongodb+srv:// connection string in backend/.env",
    );
  }

  const mongo = new MongoStorage(mongoUri);
  try {
    await mongo.connect();
    storage = mongo;
    console.log(`[storage] Connected to MongoDB (database: ${process.env.MONGO_DB_NAME || "lumora"})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`MongoDB connection failed: ${message}`);
  }
}
