import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ WAJIB
);

export default async function handler(req, res) {
  try {
    const now = new Date().toISOString();

    // 1️⃣ Ambil room expired
    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("id")
      .lte("expired_at", now);

    if (error) throw error;
    if (!rooms || rooms.length === 0) {
      return res.status(200).json({ ok: true, deleted: 0 });
    }

    let deletedRooms = 0;

    for (const room of rooms) {
      const roomId = room.id;

      // 2️⃣ DELETE DB
      await supabase.from("messages").delete().eq("room_id", roomId);
      await supabase.from("participants").delete().eq("room_id", roomId);
      await supabase.from("rooms").delete().eq("id", roomId);

      // 3️⃣ DELETE STORAGE — IMAGES
      await deleteStorageFolder("chat-images", roomId);

      // 4️⃣ DELETE STORAGE — VOICES
      await deleteStorageFolder("chat-voices", roomId);

      deletedRooms++;
    }

    return res.status(200).json({
      ok: true,
      deleted: deletedRooms
    });
  } catch (err) {
    console.error("CRON ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}

/* ======================
   HELPER: DELETE STORAGE FOLDER
====================== */
async function deleteStorageFolder(bucket, folder) {
  const { data: files } = await supabase
    .storage
    .from(bucket)
    .list(folder, { limit: 100 });

  if (!files || files.length === 0) return;

  const paths = files.map(f => `${folder}/${f.name}`);

  await supabase
    .storage
    .from(bucket)
    .remove(paths);
}
