const { put, head, del } = require("@vercel/blob");
const { handleCors, json, readJson } = require("./world/_lib");

const normalizeEnv = (value, fallback = "") => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || fallback;
};

const BLOB_READ_WRITE_TOKEN = normalizeEnv(process.env.BLOB_READ_WRITE_TOKEN);

function sanitizeSegment(input) {
  return String(input || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

function buildSnapshotPath(userId) {
  return `custom-meditations/v1/${sanitizeSegment(userId)}.json`;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (!BLOB_READ_WRITE_TOKEN) {
    return json(res, 503, { error: "BLOB_READ_WRITE_TOKEN is missing" });
  }

  try {
    if (req.method === "GET") {
      const userId = typeof req.query?.userId === "string" ? req.query.userId : "";
      if (!userId.trim()) {
        return json(res, 400, { error: "userId is required" });
      }

      const pathname = buildSnapshotPath(userId);
      let blob;
      try {
        blob = await head(pathname, { token: BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        const name = error && error.constructor ? error.constructor.name : "";
        if (name === "BlobNotFoundError") {
          return json(res, 200, { items: [], updatedAt: null, found: false });
        }
        throw error;
      }

      const response = await fetch(blob.url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch cloud snapshot (${response.status})`);
      }
      const payload = await response.json();
      return json(res, 200, {
        items: Array.isArray(payload?.items) ? payload.items : [],
        updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : null,
        found: true,
      });
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      const userId = typeof body?.userId === "string" ? body.userId : "";
      const items = Array.isArray(body?.items) ? body.items : null;
      if (!userId.trim()) {
        return json(res, 400, { error: "userId is required" });
      }
      if (!items) {
        return json(res, 400, { error: "items array is required" });
      }

      const updatedAt = typeof body?.updatedAt === "string" && body.updatedAt ? body.updatedAt : new Date().toISOString();
      const pathname = buildSnapshotPath(userId);
      const snapshot = JSON.stringify({
        userId,
        items,
        updatedAt,
      });

      const uploadedBlob = await put(pathname, snapshot, {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json; charset=utf-8",
        token: BLOB_READ_WRITE_TOKEN,
      });

      return json(res, 200, {
        ok: true,
        url: uploadedBlob.url,
        updatedAt,
        count: items.length,
      });
    }

    if (req.method === "DELETE") {
      const body = await readJson(req);
      const userId = typeof body?.userId === "string" ? body.userId : "";
      if (!userId.trim()) {
        return json(res, 400, { error: "userId is required" });
      }

      const pathname = buildSnapshotPath(userId);
      try {
        await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
      } catch (error) {
        const name = error && error.constructor ? error.constructor.name : "";
        if (name !== "BlobNotFoundError") {
          throw error;
        }
      }

      return json(res, 200, { ok: true, deleted: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Custom meditation sync failed",
    });
  }
};
