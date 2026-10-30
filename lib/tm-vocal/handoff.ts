import {
  getCurrentUser,
  supabaseRest,
  uploadPrivateFile,
  deletePrivateFile,
  downloadPrivateFile,
} from "@/lib/persistence/supabase-rest";
import type { MusicAssetRow, MusicProjectRow } from "@/lib/persistence/types";
export const HANDOFF_LABEL = "TM Vocal session";
export interface HandoffFile {
  file: File;
  kind: "stem" | "mix" | "other";
  label: string;
}
/** Reuse the canonical project UUID and owner-scoped assets; publish the manifest last. */
export async function saveHandoff(
  projectId: string,
  files: HandoffFile[],
  session: Record<string, unknown>,
): Promise<void> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      projectId,
    )
  )
    throw new Error("Select a saved song project first.");
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in before saving a private TM session.");
  const rows = await supabaseRest<MusicProjectRow[]>("music_projects", {
    query: `select=id,user_id&user_id=eq.${user.id}&id=eq.${projectId}&limit=1`,
  });
  if (!rows.length)
    throw new Error(
      "This song is not saved in your private cloud library. Open it in the Song Dashboard first.",
    );
  const stored: Array<{ path: string; id: string }> = [];
  const uploaded: string[] = [];
  try {
    for (const { file, kind, label } of files) {
      const path = await uploadPrivateFile(projectId, file, "tm-vocal");
      uploaded.push(path);
      const result = await supabaseRest<MusicAssetRow[]>("music_assets", {
        method: "POST",
        body: {
          project_id: projectId,
          user_id: user.id,
          kind,
          label,
          storage_path: path,
          original_name: file.name,
          mime_type: file.type,
          byte_size: file.size,
        },
      });
      stored.push({ path, id: result[0].id });
    }
    const manifestFile = new File(
      [
        JSON.stringify(
          {
            ...session,
            projectId,
            assets: stored,
            delivery: "private-project-library",
            createdAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      "tm-vocal-session.json",
      { type: "text/plain" },
    );
    const path = await uploadPrivateFile(projectId, manifestFile, "tm-vocal");
    uploaded.push(path);
    const result = await supabaseRest<MusicAssetRow[]>("music_assets", {
      method: "POST",
      body: {
        project_id: projectId,
        user_id: user.id,
        kind: "other",
        label: HANDOFF_LABEL,
        storage_path: path,
        original_name: manifestFile.name,
        mime_type: manifestFile.type,
        byte_size: manifestFile.size,
      },
    });
    stored.push({ path, id: result[0].id });
    // Read through RLS to verify that the manifest and files belong to a readable session.
    const readable = await downloadPrivateFile(path);
    const verified = JSON.parse(await readable.text()) as {
      projectId?: string;
      assets?: unknown[];
    };
    if (
      verified.projectId !== projectId ||
      verified.assets?.length !== files.length
    )
      throw new Error("Session verification failed.");
  } catch (error) {
    const cleanup = await Promise.allSettled([
      ...stored.map((row) =>
        supabaseRest("music_assets", {
          method: "DELETE",
          query: `id=eq.${row.id}&user_id=eq.${user.id}`,
        }),
      ),
      ...uploaded.map((path) => deletePrivateFile(path)),
    ]);
    const incomplete = cleanup.some((r) => r.status === "rejected");
    throw new Error(
      (error instanceof Error ? error.message : "TM session upload failed.") +
        (incomplete
          ? " Some partial files could not be removed; review this song’s assets in the Dashboard."
          : " No complete session was saved."),
    );
  }
}
