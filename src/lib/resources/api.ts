import { getPublicSupabaseClient } from "@/lib/supabase";
import { parsePublicResource, type PublicResource } from "./model";

export async function getPublicResources(signal: AbortSignal): Promise<PublicResource[]> {
  const { data, error } = await getPublicSupabaseClient().from("resources")
    .select("id,title,category,storage_path,file_size_bytes,status,visibility")
    .eq("status", "published").eq("visibility", "public")
    .order("category").order("title").abortSignal(signal);
  if (error || !data) throw new Error("Resources could not be loaded.");
  const resources = data.map(parsePublicResource);
  if (resources.some((resource) => !resource)) throw new Error("Resource information is incomplete.");
  return resources as PublicResource[];
}

export function publicResourceUrl(resource: PublicResource): string {
  return getPublicSupabaseClient().storage.from("resource-files")
    .getPublicUrl(resource.storagePath).data.publicUrl;
}
