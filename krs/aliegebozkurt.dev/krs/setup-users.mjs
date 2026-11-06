import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenlerini ayarlayın.");
}

const users = [
  ["sarp_kale", "Sarp Kale", "admin"],
  ["ali_ege_bozkurt", "Ali Ege Bozkurt", "admin"],
  ["ismet_yuksel", "İsmet Yüksel", "member"],
  ["aras_cirit", "Aras Cirit", "member"],
  ["mert_cosar", "Mert Coşar", "member"],
  ["defne_sengoren", "Defne Şengören", "member"],
  ["zeynep_lal_aktas", "Zeynep Lal Aktaş", "member"],
  ["kaan_turkmen", "Kaan Türkmen", "member"],
  ["doruk_kahraman", "Doruk Kahraman", "member"],
  ["rafael_oulbars_nuijens", "Rafael Oulbars Nuijens", "member"],
  ["test", "TEST", "member"],
];

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
for (const [username, display_name, role] of users) {
  const password = crypto.randomBytes(18).toString("base64url");
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@login.krs.invalid`,
    password,
    email_confirm: true,
    user_metadata: { username, display_name, role },
  });
  if (error) throw error;
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id, username, display_name, role,
  });
  if (profileError) throw profileError;
  console.log(`${display_name}\t${username}\t${password}`);
}
