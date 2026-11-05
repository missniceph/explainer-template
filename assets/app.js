/*
 * app.js — draws the explainer on the page from the content file.
 *
 * Privacy: answers live only in the `answers` object below, in memory.
 * They are never written to storage, cookies, the URL, or the network.
 * The only thing ever sent anywhere is the email sign-up (email + consent),
 * and only when the visitor presses the sign-up button.
 */
import {
  DEFAULT_UI, validateContent, evaluate, visibleQuestions, computeResult,
  isSignupPlaceholder, isValidDate
} from "./engine.js";

const app = document.getElementById("app");

/* Which content file to load. Default: content/topic.json.
 * For testing other files in the same repo: ?topic=my-other-file
 * (loads content/my-other-file.json; only simple names are allowed). */
function contentPath() {
  const name = new URLSearchParams(location.search).get("topic");
  if (name && /^[a-z0-9-]{1,60}$/i.test(name)) return `content/${name}.json`;
  return "content/topic.json";
}

/* ------------------------------------------------------------------ */
/* Tiny DOM helper                                                      */
/* ------------------------------------------------------------------ */

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v === undefined || v === null) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v; // only ever used with formatText() output
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* Very small formatting language for content text:
 *   **bold**   _italic_   [link text](https://example.org)              */
function formatText(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function paragraphs(text, cls) {
  const list = Array.isArray(text) ? text : [text];
  return list.map((p) => h("p", { class: cls, html: formatText(p) }));
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

/* ------------------------------------------------------------------ */
/* Dates & countdowns                                                   */
/* ------------------------------------------------------------------ */

function formatDate(iso, lang) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang || "en-PH", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function formatTime(hhmm, lang) {
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(lang || "en-PH", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC"
  }).format(new Date(Date.UTC(2000, 0, 1, hh, mm)));
}

/* "Today" as YYYY-MM-DD in the topic's time zone (default Philippine time). */
function todayIn(offset) {
  const ms = Date.now() + offsetMinutes(offset) * 60000;
  return new Date(ms).toISOString().slice(0, 10);
}

function offsetMinutes(offset = "+08:00") {
  const sign = offset[0] === "-" ? -1 : 1;
  const [hh, mm] = offset.slice(1).split(":").map(Number);
  return sign * (hh * 60 + mm);
}

function countdownText(d, offset, ui) {
  const today = todayIn(offset);
  const dayDiff = Math.round((Date.parse(d.date) - Date.parse(today)) / 86400000);
  if (d.time) {
    const due = Date.parse(`${d.date}T${d.time}:00${offset}`);
    const left = due - Date.now();
    if (left <= 0) return { text: ui.passed, state: "passed" };
    if (left < 48 * 3600000) {
      const hours = Math.max(1, Math.ceil(left / 3600000));
      return { text: fill(ui.hoursLeft, { n: hours }), state: "soon" };
    }
  }
  if (dayDiff < 0) return { text: ui.passed, state: "passed" };
  if (dayDiff === 0) return { text: ui.today, state: "soon" };
  if (dayDiff === 1) return { text: ui.dayLeft, state: "soon" };
  return { text: fill(ui.daysLeft, { n: dayDiff }), state: dayDiff <= 14 ? "soon" : "later" };
}

/* ------------------------------------------------------------------ */
/* Error screen                                                         */
/* ------------------------------------------------------------------ */

function showProblem(title, intro, items = [], hint) {
  document.title = "Explainer problem";
  app.replaceChildren(
    h("section", { class: "card problem", role: "alert" },
      h("h1", { text: title }),
      h("p", { text: intro }),
      items.length ? h("ol", { class: "problem-list" },
        items.map((e) => h("li", {},
          h("code", { text: e.where }), " ", e.message))) : null,
      hint ? h("p", { class: "muted", html: formatText(hint) }) : null
    )
  );
}

function jsonErrorDetail(text, err) {
  const msg = String(err && err.message || err);
  let line, col;
  const lc = msg.match(/line (\d+) column (\d+)/i);
  const pos = msg.match(/position (\d+)/i);
  if (lc) { line = +lc[1]; col = +lc[2]; }
  else if (pos) {
    const before = text.slice(0, +pos[1]).split("\n");
    line = before.length; col = before[before.length - 1].length + 1;
  }
  const where = line ? `around line ${line}, column ${col}` : "somewhere in the file";
  const tips = [
    "a missing or extra comma (there must be a comma between items, but NOT after the last one)",
    "a missing quote mark \" around text",
    "a missing closing } or ]"
  ];
  if (/(^|\s)\/\/|\/\*/m.test(text)) tips.unshift("comments (// …) — JSON files can't contain comments; the README example has them only for explanation");
  if (/[“”]/.test(text)) tips.unshift("curly quotes “ ” — JSON needs straight quotes \" (word processors often swap them)");
  return { where, tips };
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

async function main() {
  const path = contentPath();
  let text;
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (err) {
    const local = location.protocol === "file:";
    showProblem(
      "The content file couldn't be loaded",
      local
        ? "It looks like you opened index.html straight from your computer. Browsers block that for safety."
        : `The page tried to load “${path}” but couldn't find it (${err.message}).`,
      [],
      local
        ? "To preview on your computer, open a terminal in this folder and run `python3 -m http.server 8000`, then visit http://localhost:8000 — or just push to GitHub and use your GitHub Pages link."
        : "Check that the file exists in the **content** folder and that its name is spelled exactly right (lowercase, ending in .json)."
    );
    return;
  }

  let content;
  try {
    content = JSON.parse(text);
  } catch (err) {
    const { where, tips } = jsonErrorDetail(text, err);
    showProblem(
      "The content file has a typing mistake",
      `“${path}” isn't valid JSON — there's a problem ${where}. Common causes:`,
      tips.map((t) => ({ where: "check for", message: t })),
      "Tip: paste the file into a JSON checker (search “JSON validator”) to point at the exact spot."
    );
    return;
  }

  const report = validateContent(content, { today: todayIn(content?.meta?.utcOffset) });
  const isLocal = ["localhost", "127.0.0.1", ""].includes(location.hostname) ||
    new URLSearchParams(location.search).has("check");
  if (report.warnings.length) {
    console.groupCollapsed(`Explainer: ${report.warnings.length} warning(s) in ${path}`);
    report.warnings.forEach((w) => console.warn(`${w.where}: ${w.message}`));
    console.groupEnd();
  }
  if (report.errors.length) {
    showProblem(
      "This explainer needs a few fixes",
      `The content file “${path}” is missing something or has a mistake. Here's what to fix (${report.errors.length}):`,
      report.errors,
      "Fix these in the content file, save, and reload this page. The README explains every setting."
    );
    return;
  }

  render(content, isLocal ? report.warnings : []);
}

/* ------------------------------------------------------------------ */
/* Rendering                                                            */
/* ------------------------------------------------------------------ */

function render(c, warnings) {
  const ui = { ...DEFAULT_UI, ...(c.ui || {}) };
  const lang = c.meta.lang || "en";
  const offset = c.meta.utcOffset || "+08:00";
  document.documentElement.lang = lang;
  document.title = c.meta.title + (c.meta.channel?.name ? ` · ${c.meta.channel.name}` : "");
  const desc = document.querySelector('meta[name="description"]');
  if (desc && c.meta.description) desc.setAttribute("content", c.meta.description);

  setupChrome(c, ui, lang);

  const sourceNumber = new Map(c.sources.map((s, i) => [s.id, i + 1]));
  const cite = (refs) => {
    if (!refs || !refs.length) return null;
    return h("span", { class: "cites" },
      refs.map((id) => h("a", {
        class: "cite", href: `#src-${id}`,
        "aria-label": `${ui.sourcesHeading} ${sourceNumber.get(id)}`
      }, `[${sourceNumber.get(id)}]`)));
  };

  /* State — in memory only. */
  let answers = {};
  let step = 0;
  let skipped = false;

  const warningsBox = warnings.length
    ? h("details", { class: "card dev-warnings" },
        h("summary", {}, `Author check: ${warnings.length} warning(s) — only shown on localhost or with ?check`),
        h("ul", {}, warnings.map((w) => h("li", {}, h("code", { text: w.where }), " ", w.message))))
    : null;

  /* ---------- Intro ---------- */
  const intro = h("section", { class: "intro", "aria-labelledby": "page-title" },
    c.meta.sample ? h("p", { class: "sample-tag", text: ui.sampleBanner }) : null,
    h("h1", { id: "page-title", text: c.meta.title }),
    c.meta.subtitle ? h("p", { class: "subtitle", text: c.meta.subtitle }) : null,
    h("p", { class: "as-of" }, h("span", { class: "dot", "aria-hidden": "true" }),
      fill(ui.asOf, { date: formatDate(c.meta.asOf, lang) })),
    h("div", { class: "card intro-card" },
      c.intro.heading ? h("h2", { text: c.intro.heading }) : null,
      paragraphs(c.intro.body),
      h("div", { class: "actions" },
        h("button", { class: "btn primary", type: "button", onclick: () => startChecker() }, ui.start),
        h("button", { class: "btn link", type: "button", onclick: () => skipAll() }, ui.skip)),
      (c.intro.timeNote || ui.timeNote) ? h("p", { class: "muted small", text: c.intro.timeNote || ui.timeNote }) : null,
      h("p", { class: "privacy-line" }, h("span", { class: "lock", "aria-hidden": "true" }, "🔒"), " ", ui.privacyLine)
    )
  );

  /* ---------- Checker ---------- */
  const checker = h("section", { class: "card checker", id: "checker", hidden: true, "aria-labelledby": "checker-q" });

  /* ---------- Results & rest ---------- */
  const results = h("div", { id: "results", hidden: true });

  app.replaceChildren(...[warningsBox, intro, checker, results].filter(Boolean));

  function startChecker() {
    answers = {};
    step = 0;
    skipped = false;
    results.hidden = true;
    checker.hidden = false;
    drawQuestion(true);
  }

  function skipAll() {
    answers = {};
    skipped = true;
    checker.hidden = true;
    showResults();
  }

  function drawQuestion(focus) {
    const qs = visibleQuestions(c, answers);
    if (step >= qs.length) step = qs.length - 1;
    const q = qs[step];
    const type = q.type || "single";
    const current = answers[q.id];
    const total = qs.length;
    const errorId = `err-${q.id}`;
    const error = h("p", { class: "field-error", id: errorId, role: "alert", hidden: true, text: ui.needAnswer });

    const options = q.options.map((o) => {
      const checked = type === "multi" ? (current || []).includes(o.value) : current === o.value;
      const input = h("input", {
        type: type === "multi" ? "checkbox" : "radio",
        name: q.id, value: o.value, checked
      });
      return h("label", { class: "option" },
        input,
        h("span", { class: "option-text" },
          h("span", { class: "option-label", text: o.label }),
          o.help ? h("span", { class: "option-help", text: o.help }) : null));
    });

    const fieldset = h("fieldset", { "aria-describedby": q.help ? `help-${q.id}` : null },
      h("legend", { id: "checker-q", tabindex: "-1" }, q.text),
      q.help ? h("p", { class: "q-help", id: `help-${q.id}`, html: formatText(q.help) }) : null,
      h("p", { class: "muted small", text: type === "multi" ? ui.chooseAny : ui.chooseOne }),
      h("div", { class: "options" }, options),
      error);

    const pct = Math.round((step / total) * 100);
    const bar = h("div", { class: "progress-bar" });
    bar.style.width = `${Math.max(pct, 4)}%`;

    const form = h("form", {
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        const picked = [...form.querySelectorAll(`input[name="${q.id}"]:checked`)].map((i) => i.value);
        if (picked.length === 0 && !q.optional) {
          error.hidden = false;
          form.querySelector("input")?.setAttribute("aria-describedby", errorId);
          form.querySelector("input")?.focus();
          return;
        }
        if (type === "multi") answers[q.id] = picked;
        else if (picked.length) answers[q.id] = picked[0];
        else delete answers[q.id];
        const after = visibleQuestions(c, answers);
        if (step >= after.length - 1) {
          // Drop answers to questions that ended up hidden.
          const shown = new Set(after.map((x) => x.id));
          for (const k of Object.keys(answers)) if (!shown.has(k)) delete answers[k];
          checker.hidden = true;
          showResults();
        } else {
          step += 1;
          drawQuestion(true);
        }
      }
    },
      h("div", { class: "progress", role: "group", "aria-label": fill(ui.questionOf, { n: step + 1, total }) },
        h("p", { class: "progress-label", "aria-live": "polite", text: fill(ui.questionOf, { n: step + 1, total }) }),
        h("div", { class: "progress-track", "aria-hidden": "true" }, bar)),
      fieldset,
      h("div", { class: "actions split" },
        step > 0
          ? h("button", { class: "btn ghost", type: "button", onclick: () => { step -= 1; drawQuestion(true); } }, `← ${ui.back}`)
          : h("button", { class: "btn ghost", type: "button", onclick: () => { checker.hidden = true; intro.scrollIntoView({ behavior: "smooth" }); } }, `← ${ui.back}`),
        h("button", { class: "btn primary", type: "submit" }, step === total - 1 ? ui.seeResult : `${ui.next} →`))
    );

    checker.replaceChildren(form);
    if (focus) {
      checker.scrollIntoView({ behavior: "smooth", block: "start" });
      form.querySelector("legend").focus({ preventScroll: true });
    }
  }

  function showResults() {
    const blocks = skipped
      ? (c.skippedResult ? computeResult({ rules: [{ when: "always", show: [c.skippedResult] }], resultBlocks: c.resultBlocks }, {}) : [])
      : computeResult(c, answers);
    const include = (item) => skipped || evaluate(item.when, answers);

    const sections = [];

    /* Result */
    const answerSummary = !skipped
      ? h("details", { class: "answers" },
          h("summary", {}, ui.yourAnswers),
          h("dl", {}, visibleQuestions(c, answers).filter((q) => answers[q.id] !== undefined).map((q) => {
            const vals = [].concat(answers[q.id]);
            const labels = vals.map((v) => q.options.find((o) => o.value === v)?.label).join(", ");
            return [h("dt", { text: q.text }), h("dd", { text: labels || "—" })];
          })))
      : null;

    sections.push(h("section", { class: "result", "aria-labelledby": "result-h" },
      h("h2", { id: "result-h", tabindex: "-1", text: ui.resultHeading }),
      h("p", { class: "muted", text: skipped ? ui.resultSkipped : ui.resultIntro }),
      blocks.map((b) => h("article", { class: `result-block tone-${b.tone || "info"}` },
        h("h3", { text: b.title }),
        paragraphs(b.body),
        b.sources?.length ? h("p", { class: "source-line" }, `${ui.sourcesHeading}: `, cite(b.sources)) : null)),
      answerSummary,
      h("div", { class: "actions" },
        h("button", { class: "btn ghost", type: "button", onclick: () => startChecker() }, skipped ? ui.start : ui.editAnswers))
    ));

    /* Checklist */
    const items = c.checklist.items.filter(include);
    if (items.length) {
      const progress = h("p", { class: "muted small checklist-progress", "aria-live": "polite" });
      const update = () => {
        const boxes = list.querySelectorAll("input");
        const done = [...boxes].filter((b) => b.checked).length;
        progress.textContent = fill(ui.checklistProgress, { done, total: boxes.length });
      };
      const list = h("ul", { class: "checklist" }, items.map((it, i) =>
        h("li", {},
          h("label", {},
            h("input", { type: "checkbox", id: `chk-${i}`, onchange: update }),
            h("span", {},
              h("span", { class: "chk-text", html: formatText(it.text) }),
              it.detail ? h("span", { class: "chk-detail", html: formatText(it.detail) }) : null)),
          cite(it.sources))));
      update();
      sections.push(h("section", { class: "card", "aria-labelledby": "checklist-h" },
        h("div", { class: "section-head" },
          h("h2", { id: "checklist-h", text: c.checklist.heading || ui.checklistHeading }),
          h("button", { class: "btn ghost small no-print", type: "button", onclick: () => window.print() }, ui.checklistPrint)),
        c.checklist.intro ? paragraphs(c.checklist.intro, "muted") : null,
        progress, list));
    }

    /* Deadlines */
    if (c.deadlines) {
      const ds = c.deadlines.items.filter(include)
        .slice().sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
      if (ds.length) {
        sections.push(h("section", { class: "card", "aria-labelledby": "deadlines-h" },
          h("h2", { id: "deadlines-h", text: c.deadlines.heading || ui.deadlinesHeading }),
          c.deadlines.intro ? paragraphs(c.deadlines.intro, "muted") : null,
          h("ol", { class: "deadlines" }, ds.map((d) => {
            const [y, m, day] = d.date.split("-").map(Number);
            const dt = new Date(Date.UTC(y, m - 1, day));
            const badge = d.countdown ? h("span", { class: "countdown" }) : null;
            if (badge) {
              badge.dataset.date = d.date;
              if (d.time) badge.dataset.time = d.time;
            }
            const cd = d.countdown ? countdownText(d, offset, ui) : null;
            return h("li", { class: `deadline${cd ? ` state-${cd.state}` : ""}` },
              h("div", { class: "date-chip", "aria-hidden": "true" },
                h("span", { class: "m", text: new Intl.DateTimeFormat(lang, { month: "short", timeZone: "UTC" }).format(dt) }),
                h("span", { class: "d", text: String(day) })),
              h("div", { class: "deadline-body" },
                h("h3", { text: d.title }),
                h("p", { class: "when" },
                  h("time", { datetime: d.date + (d.time ? `T${d.time}` : "") },
                    formatDate(d.date, lang) + (d.time ? `, ${formatTime(d.time, lang)}` : "") +
                    (d.time && c.meta.timeZoneLabel ? ` (${c.meta.timeZoneLabel})` : "")),
                  badge),
                d.description ? paragraphs(d.description) : null,
                cite(d.sources)));
          }))));
      }
    }

    /* FAQ */
    sections.push(h("section", { class: "card", "aria-labelledby": "faq-h" },
      h("h2", { id: "faq-h", text: c.faq.heading || ui.faqHeading }),
      h("div", { class: "faq" }, c.faq.items.map((f) =>
        h("details", {},
          h("summary", {}, f.question),
          h("div", { class: "faq-a" }, paragraphs(f.answer), cite(f.sources)))))));

    /* Disclaimer */
    sections.push(h("aside", { class: "disclaimer", "aria-labelledby": "disc-h" },
      h("h2", { id: "disc-h", text: ui.disclaimerHeading }),
      paragraphs(c.disclaimer),
      h("p", { class: "small", text: fill(ui.asOf, { date: formatDate(c.meta.asOf, lang) }) })));

    /* Sources */
    sections.push(h("section", { class: "card", "aria-labelledby": "sources-h" },
      h("h2", { id: "sources-h", text: ui.sourcesHeading }),
      h("ol", { class: "sources" }, c.sources.map((s) =>
        h("li", { id: `src-${s.id}` },
          s.url
            ? h("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", text: s.title })
            : h("span", { text: s.title }),
          s.publisher ? h("span", { class: "muted" }, ` — ${s.publisher}`) : null,
          s.accessed && isValidDate(s.accessed) ? h("span", { class: "muted small block" }, fill(ui.sourceAccessed, { date: formatDate(s.accessed, lang) })) : null,
          s.note ? h("span", { class: "muted small block", text: s.note }) : null)))));

    /* Sign-up */
    if (c.signup && c.signup.enabled) sections.push(signupSection(c.signup, ui));

    results.replaceChildren(...sections);
    results.hidden = false;
    updateCountdowns();
    const heading = results.querySelector("#result-h");
    heading.scrollIntoView({ behavior: "smooth", block: "start" });
    heading.focus({ preventScroll: true });
  }

  function updateCountdowns() {
    results.querySelectorAll(".countdown").forEach((el) => {
      const { text, state } = countdownText({ date: el.dataset.date, time: el.dataset.time }, offset, ui);
      el.textContent = text;
      const li = el.closest(".deadline");
      li.classList.remove("state-passed", "state-soon", "state-later");
      li.classList.add(`state-${state}`);
    });
  }
  setInterval(() => { if (!results.hidden) updateCountdowns(); }, 60000);
}

/* ------------------------------------------------------------------ */
/* Email sign-up → Google Form                                          */
/* ------------------------------------------------------------------ */

function signupSection(s, ui) {
  const preview = isSignupPlaceholder(s);
  const status = h("p", { class: "signup-status", role: "status", "aria-live": "polite" });
  const email = h("input", { type: "email", id: "signup-email", name: "email", autocomplete: "email", required: true, inputmode: "email", placeholder: "you@example.com" });
  const consent = h("input", { type: "checkbox", id: "signup-consent", name: "consent", required: true });
  const button = h("button", { class: "btn primary", type: "submit" }, s.submitLabel || ui.signupSubmit);

  const form = h("form", {
    class: "signup-form", novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      status.className = "signup-status";
      const value = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        status.textContent = ui.signupErrorEmail;
        status.classList.add("is-error");
        email.focus();
        return;
      }
      if (!consent.checked) {
        status.textContent = ui.signupErrorConsent;
        status.classList.add("is-error");
        consent.focus();
        return;
      }
      if (preview) {
        status.textContent = ui.signupPreview;
        status.classList.add("is-warn");
        return;
      }
      button.disabled = true;
      button.textContent = ui.signupSending;
      // Only these fields are sent: the email, the consent value, and any
      // fixed "extraFields" from the content file. Never the checker answers.
      const body = new URLSearchParams();
      body.append(s.emailEntry, value);
      body.append(s.consentEntry, s.consentValue || "Yes");
      for (const [k, v] of Object.entries(s.extraFields || {})) body.append(k, v);
      try {
        // "no-cors": Google doesn't let us read the reply, so we can only
        // tell that the request left the browser, not that Google saved it.
        await fetch(s.formAction, { method: "POST", mode: "no-cors", body });
        form.replaceChildren(h("p", { class: "signup-success", role: "status", tabindex: "-1" },
          "✓ ", s.successMessage || "Thank you! You're on the list."));
        form.querySelector(".signup-success").focus();
      } catch {
        status.textContent = ui.signupErrorNetwork;
        status.classList.add("is-error");
        button.disabled = false;
        button.textContent = s.submitLabel || ui.signupSubmit;
      }
    }
  },
    h("label", { class: "field-label", for: "signup-email", text: ui.signupEmail }),
    email,
    h("label", { class: "consent" }, consent, h("span", { html: formatText(s.consentLabel) })),
    h("div", { class: "privacy-notice" },
      paragraphs(s.privacyNotice, "small"),
      s.privacyUrl ? h("p", { class: "small" }, h("a", { href: s.privacyUrl, target: "_blank", rel: "noopener noreferrer" }, "Privacy policy")) : null),
    button,
    status
  );

  return h("section", { class: "card signup no-print", "aria-labelledby": "signup-h" },
    h("h2", { id: "signup-h", text: s.heading }),
    s.body ? paragraphs(s.body) : null,
    preview ? h("p", { class: "preview-note small", text: ui.signupPreview }) : null,
    form);
}

/* ------------------------------------------------------------------ */
/* Header, footer, sample banner, theme toggle                          */
/* ------------------------------------------------------------------ */

function setupChrome(c, ui, lang) {
  const ch = c.meta.channel || {};
  const brand = document.getElementById("brand");
  if (brand) {
    if (ch.name) brand.querySelector(".brand-name").textContent = ch.name;
    if (ch.handle) brand.querySelector(".brand-handle").textContent = ch.handle;
    if (ch.url) brand.setAttribute("href", ch.url);
  }

  const banner = document.getElementById("sample-banner");
  if (banner && c.meta.sample) {
    banner.textContent = ui.sampleBanner;
    banner.hidden = false;
  }

  const foot = document.getElementById("footer-meta");
  if (foot) {
    foot.replaceChildren(
      h("p", {}, fill(ui.asOf, { date: formatDate(c.meta.asOf, lang) })),
      h("p", {}, ui.privacyLine));
  }

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    const label = () => {
      const dark = document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
      toggle.setAttribute("aria-label", dark ? ui.themeToLight : ui.themeToDark);
      toggle.setAttribute("title", dark ? ui.themeToLight : ui.themeToDark);
      toggle.dataset.mode = dark ? "dark" : "light";
    };
    label();
    toggle.addEventListener("click", () => {
      const dark = toggle.dataset.mode === "dark";
      const next = dark ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("explainer-theme", next); } catch { /* storage blocked: fine */ }
      label();
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", label);
  }
}

main();
