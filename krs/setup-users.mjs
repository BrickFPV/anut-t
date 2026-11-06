import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resetExisting = process.env.RESET_EXISTING_PASSWORDS === "true";
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
  const email = `${username}@login.krs.invalid`;
  let data;
  let error;
  try {
    ({ data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, display_name, role },
    }));
  } catch (createError) {
    if (createError?.code === "email_exists" || createError?.status === 422) {
      error = createError;
    } else {
      throw createError;
    }
  }
  let user = data?.user;
  if (error?.code === "email_exists") {
    const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    user = usersPage.users.find((candidate) => candidate.email === email);
    if (!user) throw error;
    if (resetExisting) {
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
      if (updateError) throw updateError;
      user = updated.user;
      console.log(`${display_name}\t${username}\t${password}`);
    } else {
      console.log(`${display_name}: mevcut hesap bulundu; şifre değiştirilmedi.`);
    }
  } else if (error) {
    throw error;
  } else {
    console.log(`${display_name}\t${username}\t${password}`);
  }
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user.id, username, display_name, role,
  }, { onConflict: "id" });
  if (profileError) throw profileError;
}
