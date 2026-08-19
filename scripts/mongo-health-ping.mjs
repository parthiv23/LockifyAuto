/**
 * Bi-weekly Atlas ping + EmailJS status mail.
 * Used by .github/workflows/mongo-health-ping.yml
 *
 * Env:
 *   MONGO_URI
 *   EMAILJS_SERVICE_ID
 *   EMAILJS_TEMPLATE_ID
 *   EMAILJS_PUBLIC_KEY
 *   EMAILJS_PRIVATE_KEY
 *   EMAIL_TO (optional)
 */
import { MongoClient } from "mongodb";

const TO_EMAIL = process.env.EMAIL_TO || "parthivshah293@gmail.com";
const PING_HOUR_UTC = 8;
const PING_MINUTE_UTC = 17;
const PING_DAYS = [1, 15];

function formatWhen(date) {
  const dateIst = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timeIst = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    timeStyle: "short",
  }).format(date);
  const timeUtc = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${dateIst}, ${timeIst} IST (${timeUtc} UTC)`;
}

function nextPingAfter(now) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const candidates = [];
  for (let offset = 0; offset <= 2; offset++) {
    for (const day of PING_DAYS) {
      candidates.push(Date.UTC(year, month + offset, day, PING_HOUR_UTC, PING_MINUTE_UTC, 0));
    }
  }
  const next = candidates.find((ms) => ms > now.getTime());
  return new Date(next ?? Date.UTC(year, month + 3, 1, PING_HOUR_UTC, PING_MINUTE_UTC, 0));
}

async function pingMongo() {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    return { awake: false, detail: "MONGO_URI is missing or invalid" };
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    return { awake: true, detail: "MongoDB accepted a ping" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { awake: false, detail: message };
  } finally {
    await client.close().catch(() => {});
  }
}

async function sendEmail(params) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS env is incomplete (need SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY)");
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: params,
  };
  if (privateKey) body.accessToken = privateKey;

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`EmailJS ${res.status}: ${text || res.statusText}`);
  }
}

const now = new Date();
const next = nextPingAfter(now);
const mongo = await pingMongo();
const COLOR_GREEN = "#16a34a";
const COLOR_RED = "#dc2626";
const mongoStatus = mongo.awake ? "awake" : "not awake (paused or unreachable)";
const pingAt = formatWhen(now);
const nextPingAt = formatWhen(next);
const statusColor = mongo.awake ? COLOR_GREEN : COLOR_RED;

console.log(`mongo=${mongoStatus}`);
console.log(`ping_at=${pingAt}`);
console.log(`next_ping=${nextPingAt}`);
if (!mongo.awake) console.log(`detail=${mongo.detail}`);

try {
  await sendEmail({
    to_email: TO_EMAIL,
    to_name: "Parthiv",
    mongo_status: mongoStatus,
    ping_at: pingAt,
    next_ping_at: nextPingAt,
    green: COLOR_GREEN,
    red: COLOR_RED,
    status_color: statusColor,
    message: mongo.awake
      ? "A bi-weekly health ping was sent. MongoDB Atlas is awake."
      : `A bi-weekly health ping was sent. MongoDB Atlas is not awake. ${mongo.detail}`,
  });
  console.log(`email_sent_to=${TO_EMAIL}`);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`email_failed=${message}`);
  process.exitCode = 1;
}
