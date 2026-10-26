// FCC Hub: sign in once, see the church apps your role uses.
// Sign-in and roles come from the same Supabase project as the attendance app (rpc app_me).

const cfg = window.FCC_CONFIG;
const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
const $ = (id) => document.getElementById(id);
const ROLE = { admin: "Admin", bishop: "Bishop", lead: "Church admin", team: "Team", pastor: "Pastor" };

document.querySelectorAll(".church-name").forEach((el) => (el.textContent = cfg.churchName));

function show(screen) {
  ["loading", "signin", "nosetup", "hub"].forEach((id) => $(id).classList.toggle("hidden", id !== screen));
}

// ---------- Sign in (email code or password, like the attendance app) ----------

let mode = "code";
let codeSentTo = "";

function say(text, isError) {
  const m = $("msg");
  m.textContent = text;
  m.classList.toggle("err", !!isError);
  m.classList.remove("hidden");
}

function setMode(next) {
  mode = next;
  document.querySelectorAll(".seg [data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
  $("pw-field").classList.toggle("hidden", mode !== "pw");
  $("code-field").classList.toggle("hidden", mode !== "code" || !codeSentTo);
  $("resend").classList.toggle("hidden", mode !== "code" || !codeSentTo);
  $("go").textContent = mode === "pw" ? "Sign in" : codeSentTo ? "Sign in" : "Email me a code";
  $("msg").classList.add("hidden");
}

document.querySelectorAll(".seg [data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

async function sendCode(email) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) throw new Error("We couldn't send a code to that email. Check it's the one your church admin added.");
  codeSentTo = email;
  setMode("code");
  say(`We emailed a code to ${email}. Type it in below.`);
  $("code").focus();
}

$("resend").addEventListener("click", async () => {
  try { await sendCode($("email").value.trim().toLowerCase()); } catch (e) { say(e.message, true); }
});

$("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return say("Please type your email, like name@example.com.", true);
  const go = $("go");
  go.disabled = true;
  try {
    if (mode === "pw") {
      const password = $("password").value;
      if (!password) throw new Error("Please type your password.");
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("That email and password don't match. Try again, or use Email code.");
    } else if (!codeSentTo || codeSentTo !== email) {
      await sendCode(email);
      return;
    } else {
      const token = $("code").value.trim();
      if (!token) throw new Error("Type the code from the email first, or tap Send a new code.");
      const { error } = await sb.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw new Error("That code didn't work. Check it, or tap Send a new code.");
    }
    await start();
  } catch (err) {
    say(err.message, true);
  } finally {
    go.disabled = false;
  }
});

document.querySelectorAll("[data-signout]").forEach((b) =>
  b.addEventListener("click", async () => {
    await sb.auth.signOut();
    codeSentTo = "";
    $("code").value = "";
    $("password").value = "";
    setMode("code");
    show("signin");
  })
);

// ---------- Hub ----------

function sharedLink(url) {
  const u = new URL(url);
  u.searchParams.set("shared", "1");
  return u.toString();
}

function fillLinks() {
  const newTab = settings.open !== "same"; // new tab unless this device chose same tab
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = cfg.links[a.dataset.link];
    a.href = a.hasAttribute("data-shared") ? sharedLink(url) : url;
    if (newTab) {
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }
  });
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-NZ", { hour: "numeric", hourCycle: "h23", timeZone: "Pacific/Auckland" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function showHub(me) {
  const role = me.role;
  const first = (me.name || "").trim().split(/\s+/)[0];
  const roleName = me.title || ROLE[role] || role;

  $("who-name").textContent = me.name || me.email;
  $("who-role").textContent = roleName + (me.church && role !== "admin" && role !== "bishop" ? ` · ${me.church}` : "");
  $("greeting").textContent = first ? `${greeting()}, ${first}` : greeting();

  let count = 0;
  document.querySelectorAll(".tile[data-app]").forEach((t) => {
    const ok = (cfg.access[t.dataset.app] || []).includes(role);
    t.classList.toggle("hidden", !ok);
    if (ok) count += 1;
  });
  $("no-apps").classList.toggle("hidden", count > 0);
  $("can-open").textContent = count ? `You're signed in as ${roleName}. You can open ${count} app${count === 1 ? "" : "s"}.` : "";

  fillLinks();
  show("hub");
}

async function start() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    setMode("code");
    show("signin");
    return;
  }
  const { data: me, error } = await sb.rpc("app_me");
  if (error) {
    show("signin");
    say("We couldn't load your account. Please sign in again.", true);
    return;
  }
  if (!me || !me.role) {
    $("nosetup-email").textContent = me?.email || "This email";
    show("nosetup");
    return;
  }
  showHub(me);
}

// ---------- Settings (saved on this device only) ----------

const SETTINGS_KEY = "fcc-hub-settings";
const LOOKS = ["theme", "accent", "text", "contrast", "reading"]; // set on <html> as data-*
let settings = {};
try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch { settings = {}; }

function applySettings() {
  LOOKS.forEach((k) => {
    if (settings[k]) document.documentElement.dataset[k] = settings[k];
    else delete document.documentElement.dataset[k];
  });
  fillLinks();
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* private browsing: works until the page closes */ }
}

function showSettingsForm() {
  const f = $("settings-form");
  ["theme", "accent", "text", "open"].forEach((k) => {
    f.querySelectorAll(`input[name="${k}"]`).forEach((r) => (r.checked = r.value === (settings[k] || "")));
  });
  ["contrast", "reading"].forEach((k) => (f.elements[k].checked = !!settings[k]));
}

$("settings-form").addEventListener("change", (e) => {
  const input = e.target;
  if (input.type === "checkbox") settings[input.name] = input.checked ? input.value : "";
  else settings[input.name] = input.value;
  Object.keys(settings).forEach((k) => { if (!settings[k]) delete settings[k]; });
  saveSettings();
  applySettings();
});

$("settings-reset").addEventListener("click", () => {
  settings = {};
  saveSettings();
  applySettings();
  showSettingsForm();
});

$("open-settings").addEventListener("click", () => {
  showSettingsForm();
  $("settings").showModal();
});

// ---------- QR codes (to print and put on a table) ----------

const qrDialog = $("qr");
let qrUrl = "";

document.querySelectorAll("[data-qr]").forEach((b) =>
  b.addEventListener("click", () => {
    qrUrl = cfg.links[b.dataset.qr]; // the normal form: people scan with their own phones
    $("qr-title").textContent = b.dataset.qrTitle;
    $("qr-url").textContent = qrUrl.replace(/^https?:\/\//, "");
    const qr = window.qrcode(0, "M");
    qr.addData(qrUrl);
    qr.make();
    $("qr-img").innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
    qrDialog.showModal();
  })
);

$("qr-close").addEventListener("click", () => qrDialog.close());
$("qr-print").addEventListener("click", () => window.print());
$("qr-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(qrUrl);
    $("qr-copy").textContent = "Copied";
  } catch {
    $("qr-copy").textContent = "Couldn't copy";
  }
  setTimeout(() => ($("qr-copy").textContent = "Copy link"), 2000);
});

start();
