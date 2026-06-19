import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Upload to a bucket and return a long-lived signed URL stored in DB. */
export async function uploadAndSign(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (sErr || !data) throw sErr ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

export async function createSignedUrl(bucket: string, path: string, seconds = TEN_YEARS) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

/** Extract the storage object path from a Supabase signed URL (for admin delete). */
export function pathFromSignedUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const marker = `/object/sign/${bucket}/`;
    const i = u.pathname.indexOf(marker);
    if (i < 0) return null;
    return decodeURIComponent(u.pathname.slice(i + marker.length));
  } catch {
    return null;
  }
}
