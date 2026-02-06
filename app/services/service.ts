import { SUPABASE } from "@/context";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export async function listServices() {
  const supabase = SUPABASE.get();
  return await supabase
    .from("services")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });
}

export async function createService(params: {
  name: string;
  description?: string | null;
}) {
  const { name, description } = params;
  const supabase = SUPABASE.get();
  return await supabase
    .from("services")
    .insert({ name, description: description ?? "" })
    .select("id")
    .single();
}
