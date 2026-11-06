const NOTE_TYPES = [
  "Mesajlara Bakma",
  "Toplantılara Aktif Katılım",
  "Yer Alınan Alt Dallar veya Ek İşleri Eksiksiz ve Düzgün Tamamlama",
  "Yer Aldığı Bölüme Katkı Sağlama",
  "Grup ve Toplantılarda Ciddiyet",
];

const supabaseUrl = window.KRS_CONFIG?.supabaseUrl;
const supabaseAnonKey = window.KRS_CONFIG?.supabaseAnonKey;
const client = supabaseUrl && supabaseAnonKey
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

const elements = {
  loginView: document.querySelector("#login-view"),
  dashboardView: document.querySelector("#dashboard-view"),
  loginForm: document.querySelector("#login-form"),
  loginError: document.querySelector("#login-error"),
  username: document.querySelector("#username"),
  currentUserLabel: document.querySelector("#current-user-label"),
  logoutButton: document.querySelector("#logout-button"),
  dashboardTitle: document.querySelector("#dashboard-title"),
  roleBadge: document.querySelector("#role-badge"),
  adminPanel: document.querySelector("#admin-panel"),
  memberPanel: document.querySelector("#member-panel"),
  memberSelect: document.querySelector("#member-select"),
  adminNotesGrid: document.querySelector("#admin-notes-grid"),
  memberNotesGrid: document.querySelector("#member-notes-grid"),
  saveStatus: document.querySelector("#save-status"),
};

function usernameEmail(username) {
  return `${username}@login.krs.invalid`;
}

function setStatus(message, isError = false) {
  elements.saveStatus.textContent = message;
  elements.saveStatus.style.color = isError ? "var(--danger)" : "var(--success)";
  window.setTimeout(() => { elements.saveStatus.textContent = ""; }, 3500);
}

function showLoginError(message) {
  elements.loginError.textContent = message;
}

function noteCard(member, note, editable) {
  const card = document.createElement("article");
  card.className = "note-card";
  card.innerHTML = `
    <h4>${escapeHtml(note.note_type)}</h4>
    <div class="note-score">
      <label for="score-${note.note_type}">Not (0-100)</label>
      <input id="score-${note.note_type}" type="number" min="0" max="100" step="1"
        value="${note.score ?? ""}" ${editable ? "" : "disabled"} />
    </div>
    <label for="comment-${note.note_type}">Açıklama</label>
    <textarea id="comment-${note.note_type}" ${editable ? "" : "disabled"}>${escapeHtml(note.comment || "")}</textarea>
    ${editable ? '<button class="button button-primary save-note" type="button">Notu kaydet</button>' : ""}
  `;
  if (editable) {
    card.querySelector(".save-note").addEventListener("click", async () => {
      const scoreValue = card.querySelector("input").value;
      const score = scoreValue === "" ? null : Number(scoreValue);
      if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) {
        setStatus("Not 0 ile 100 arasında tam sayı olmalıdır.", true);
        return;
      }
      const { error } = await client.from("notes").upsert({
        member_id: member.id,
        note_type: note.note_type,
        score,
        comment: card.querySelector("textarea").value,
        updated_at: new Date().toISOString(),
      }, { onConflict: "member_id,note_type" });
      if (error) {
        setStatus("Not kaydedilemedi. Lütfen tekrar deneyin.", true);
        console.error(error);
        return;
      }
      setStatus("Not başarıyla kaydedildi.");
    });
  }
  return card;
}

async function loadNotes(member, container, editable) {
  const { data, error } = await client.from("notes")
    .select("note_type, score, comment")
    .eq("member_id", member.id);
  if (error) {
    setStatus("Notlar yüklenemedi.", true);
    console.error(error);
    return;
  }
  const saved = new Map((data || []).map((note) => [note.note_type, note]));
  container.replaceChildren(...NOTE_TYPES.map((noteType) => noteCard(
    member,
    saved.get(noteType) || { note_type: noteType, score: null, comment: "" },
    editable,
  )));
}

async function renderDashboard() {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return;
  const { data: profile, error } = await client.from("profiles")
    .select("id, username, display_name, role")
    .eq("id", user.id)
    .single();
  if (error) {
    showLoginError("Profil bilgileri alınamadı.");
    console.error(error);
    return;
  }
  const isAdmin = profile.role === "admin";
  elements.loginView.classList.add("hidden");
  elements.dashboardView.classList.remove("hidden");
  elements.currentUserLabel.textContent = profile.display_name;
  elements.dashboardTitle.textContent = isAdmin ? "Takım raporları" : "Notlarım";
  elements.roleBadge.textContent = isAdmin ? "ADMIN" : "TAKIM ÜYESİ";
  elements.adminPanel.classList.toggle("hidden", !isAdmin);
  elements.memberPanel.classList.toggle("hidden", isAdmin);

  if (isAdmin) {
    const { data: members, error: membersError } = await client.from("profiles")
      .select("id, username, display_name, role")
      .order("display_name");
    if (membersError) {
      setStatus("Takım üyeleri yüklenemedi.", true);
      console.error(membersError);
      return;
    }
    elements.memberSelect.replaceChildren(...members.map((member) => {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = member.display_name;
      return option;
    }));
    await loadNotes(members[0], elements.adminNotesGrid, true);
    elements.memberSelect.onchange = async () => {
      const selected = members.find((member) => member.id === elements.memberSelect.value);
      if (selected) await loadNotes(selected, elements.adminNotesGrid, true);
    };
  } else {
    await loadNotes(profile, elements.memberNotesGrid, false);
  }
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) {
    showLoginError("Supabase ayarları yapılmamış. config.js dosyasını doldurun.");
    return;
  }
  const username = elements.username.value.trim().toLowerCase();
  const password = new FormData(elements.loginForm).get("password");
  const { error } = await client.auth.signInWithPassword({
    email: usernameEmail(username),
    password,
  });
  if (error) {
    showLoginError("Kullanıcı adı veya şifre hatalı.");
    return;
  }
  showLoginError("");
  elements.loginForm.reset();
  await renderDashboard();
});

elements.logoutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  elements.dashboardView.classList.add("hidden");
  elements.loginView.classList.remove("hidden");
});

if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    if (session) renderDashboard();
  });
}
