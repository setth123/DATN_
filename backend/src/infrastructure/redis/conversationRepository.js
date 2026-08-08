const CONVERSATION_KEY = (id) => `chat:conversation:${id}`;

import redis from "./redisClient.js";

const TTL = Number(process.env.REDIS_TTL || 900);

export async function createConversation(id, data) {
  const key = CONVERSATION_KEY(id);

  await redis.set(
    key,
    JSON.stringify(data),
    "EX",
    TTL
  );
}

export async function getConversation(id) {
  const key = CONVERSATION_KEY(id);
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function updateConversation(id, data) {
  const key = CONVERSATION_KEY(id);

  await redis.set(
    key,
    JSON.stringify(data),
    "EX",
    TTL // reset TTL mỗi lần update
  );
}
