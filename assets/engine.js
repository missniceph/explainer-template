/*
 * engine.js — the "brain" of the explainer.
 *
 * - validateContent(): checks a content file and returns friendly errors/warnings.
 * - evaluate():        checks a "when" condition against the visitor's answers.
 * - computeResult():   works out which result blocks to show.
 *
 * This file has no browser-only code, so the same checks run in the browser
 * AND in `node tools/validate.mjs` (used by the GitHub Action).
 */

export const SCHEMA_VERSION = 1;

/* Default wording for buttons and labels. Any of these can be overridden
 * per topic with the "ui" object in the content file (e.g. for Filipino). */
export const DEFAULT_UI = {
  start: "Start the checker",
  skip: "Skip the questions and show everything",
  timeNote: "",
  next: "Next",
  back: "Back",
  seeResult: "See my result",
  startOver: "Start over",
  editAnswers: "Change my answers",
  questionOf: "Question {n} of {total}",
  chooseOne: "Choose one",
  chooseAny: "Choose all that apply",
  needAnswer: "Please choose an answer to continue.",
  resultHeading: "Your result",
  resultIntro: "Based on your answers:",
  resultSkipped: "You skipped the questions, so everything is shown below. Answer the questions for a personalized result.",
  yourAnswers: "Your answers",
  checklistHeading: "Your checklist",
  checklistPrint: "Print or save as PDF",
  checklistProgress: "{done} of {total} done",
  deadlinesHeading: "Deadlines",
  faqHeading: "Frequently asked questions",
  sourcesHeading: "Sources",
  sourceAccessed: "Checked {date}",
  asOf: "Information as of {date}",
  daysLeft: "{n} days left",
  dayLeft: "1 day left",
  hoursLeft: "{n} hours left",
  today: "Today",
  passed: "Passed",
  privacyLine: "Your answers stay in this browser tab. They are never saved or sent anywhere.",
  sampleBanner: "SAMPLE CONTENT – NOT REAL",
  disclaimerHeading: "Please note",
  signupEmail: "Email address",
  signupSubmit: "Sign me up",
  signupSending: "Sending…",
  signupErrorEmail: "Please enter a valid email address.",
  signupErrorConsent: "Please tick the consent box so we're allowed to email you.",
  signupErrorNetwork: "Something went wrong. Please check your connection and try again.",
  signupPreview: "Preview only: this form isn't connected to a Google Form yet, so nothing will be sent.",
  themeToLight: "Switch to light mode",
  themeToDark: "Switch to dark mode",
  backToTop: "Back to top"
};

const TONES = ["info", "good", "warn", "action"];
const ID_RE = /^[A-Za-z0-9_-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const OFFSET_RE = /^[+-](0\d|1[0-4]):[0-5]\d$/;
const ENTRY_RE = /^entry\.\d+$/;
const FORM_RE = /^https:\/\/docs\.google\.com\/forms\/(u\/\d+\/)?d\/e\/[A-Za-z0-9_-]+\/formResponse$/;
const PLACEHOLDER_RE = /YOUR_FORM_ID|^entry\.0{9}\d$/;

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

/* "Text" can be one string or a list of strings (one per paragraph). */
function isText(v) {
  if (isNonEmptyString(v)) return true;
  return Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString);
}

export function isValidDate(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isSignupPlaceholder(signup) {
  if (!signup) return false;
  return [signup.formAction, signup.emailEntry, signup.consentEntry]
    .some((v) => typeof v === "string" && PLACEHOLDER_RE.test(v));
}

/* ------------------------------------------------------------------ */
/* Conditions                                                           */
/* ------------------------------------------------------------------ */

/*
 * A condition ("when" / "showIf") is one of:
 *   { "question": "age", "is": "adult" }          answer is (or, for multi-choice, includes) this option
 *   { "question": "age", "isNot": "adult" }       answered, and did NOT pick this option
 *   { "question": "age", "in": ["a", "b"] }       picked at least one of these
 *   { "question": "age", "notIn": ["a", "b"] }    answered, and picked none of these
 *   { "question": "items", "includesAll": [...] } multi-choice: picked every one of these
 *   { "question": "age", "answered": true }       the question was (or was not) answered
 *   { "all": [cond, cond] }  every condition is true
 *   { "any": [cond, cond] }  at least one is true
 *   { "not": cond }          the opposite
 *   "always"                 always true (same as leaving "when" out)
 * An unanswered (skipped or hidden) question makes every check false
 * except { "answered": false }.
 */
export function evaluate(cond, answers) {
  if (cond === undefined || cond === null || cond === "always") return true;
  if (!isPlainObject(cond)) return false;
  if ("all" in cond) return cond.all.every((c) => evaluate(c, answers));
  if ("any" in cond) return cond.any.some((c) => evaluate(c, answers));
  if ("not" in cond) return !evaluate(cond.not, answers);

  const a = answers[cond.question];
  const answered = a !== undefined && !(Array.isArray(a) && a.length === 0);
  if ("answered" in cond) return answered === cond.answered;
  if (!answered) return false;

  const picked = Array.isArray(a) ? a : [a];
  if ("is" in cond) return picked.includes(cond.is);
  if ("isNot" in cond) return !picked.includes(cond.isNot);
  if ("in" in cond) return picked.some((v) => cond.in.includes(v));
  if ("notIn" in cond) return !picked.some((v) => cond.notIn.includes(v));
  if ("includesAll" in cond) return cond.includesAll.every((v) => picked.includes(v));
  return false;
}

/* Questions that should be asked, given the answers so far. */
export function visibleQuestions(content, answers) {
  return content.questions.filter((q) => evaluate(q.showIf, answers));
}

/*
 * Work out which result blocks to show.
 * Rules are checked from top to bottom. Every rule whose "when" is true
 * adds its "show" blocks. A rule with "stop": true ends the checking.
 * If nothing matched, "fallbackResult" is shown.
 */
export function computeResult(content, answers) {
  const ids = [];
  for (const rule of content.rules || []) {
    if (evaluate(rule.when, answers)) {
      for (const id of rule.show) if (!ids.includes(id)) ids.push(id);
      if (rule.stop) break;
    }
  }
  if (ids.length === 0 && content.fallbackResult) ids.push(content.fallbackResult);
  const byId = new Map((content.resultBlocks || []).map((b) => [b.id, b]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Validation                                                           */
/* ------------------------------------------------------------------ */

const TOP_KEYS = [
  "$schema", "_comment", "schemaVersion", "meta", "ui", "intro", "questions",
  "resultBlocks", "rules", "fallbackResult", "skippedResult", "checklist",
  "deadlines", "faq", "sources", "disclaimer", "signup"
];

class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  error(where, msg) { this.errors.push({ where, message: msg }); }
  warn(where, msg) { this.warnings.push({ where, message: msg }); }
}

/* Builds readable locations like: questions › #2 “age” › options */
function loc(...parts) {
  return parts.filter((p) => p !== undefined && p !== "").join(" › ");
}
function itemLabel(i, obj) {
  const id = obj && typeof obj.id === "string" ? ` “${obj.id}”` : "";
  return `#${i + 1}${id}`;
}

function checkKeys(r, obj, allowed, where) {
  if (!isPlainObject(obj)) return;
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key) && !key.startsWith("_")) {
      r.warn(where, `Unknown setting "${key}" will be ignored. Check the spelling? Allowed here: ${allowed.join(", ")}.`);
    }
  }
}

function checkSourceRefs(r, refs, sourceIds, used, where) {
  if (refs === undefined) return;
  if (!Array.isArray(refs) || !refs.every((s) => typeof s === "string")) {
    r.error(where, `"sources" must be a list of source ids, like ["s1", "s2"].`);
    return;
  }
  for (const ref of refs) {
    if (!sourceIds.has(ref)) {
      r.error(where, `Refers to source "${ref}", but there is no source with that id in "sources".`);
    } else {
      used.add(ref);
    }
  }
}

/*
 * Check a condition. `known` maps question id → question, and holds only the
 * questions a condition is allowed to look at.
 */
function checkCondition(r, cond, known, where, allQuestions) {
  if (cond === undefined || cond === "always") return;
  if (!isPlainObject(cond)) {
    r.error(where, `A condition must be an object like { "question": "age", "is": "adult" }, or the word "always".`);
    return;
  }
  for (const group of ["all", "any"]) {
    if (group in cond) {
      if (!Array.isArray(cond[group]) || cond[group].length === 0) {
        r.error(where, `"${group}" must be a list of one or more conditions.`);
        return;
      }
      cond[group].forEach((c, i) => checkCondition(r, c, known, loc(where, `${group} #${i + 1}`), allQuestions));
      return;
    }
  }
  if ("not" in cond) {
    checkCondition(r, cond.not, known, loc(where, "not"), allQuestions);
    return;
  }
  if (!isNonEmptyString(cond.question)) {
    r.error(where, `This condition is missing "question" (the id of the question it checks), or "all" / "any" / "not".`);
    return;
  }
  const q = known.get(cond.question);
  if (!q) {
    if (allQuestions && allQuestions.has(cond.question)) {
      r.error(where, `"showIf" can only look at questions that come BEFORE this one, but “${cond.question}” comes later.`);
    } else {
      r.error(where, `Refers to question "${cond.question}", but no question has that id.`);
    }
    return;
  }
  const ops = ["is", "isNot", "in", "notIn", "includesAll", "answered"].filter((k) => k in cond);
  if (ops.length !== 1) {
    r.error(where, `A question condition needs exactly one of: "is", "isNot", "in", "notIn", "includesAll", "answered".`);
    return;
  }
  const op = ops[0];
  const values = Array.isArray(q.options) ? q.options.map((o) => o && o.value) : [];
  if (op === "answered") {
    if (typeof cond.answered !== "boolean") r.error(where, `"answered" must be true or false.`);
    return;
  }
  const list = ["in", "notIn", "includesAll"].includes(op) ? cond[op] : [cond[op]];
  if (!Array.isArray(list) || list.length === 0) {
    r.error(where, `"${op}" must be a list of option values, like ["a", "b"].`);
    return;
  }
  if (op === "includesAll" && q.type !== "multi") {
    r.warn(where, `"includesAll" only makes sense for multi-choice questions; “${q.id}” is single-choice.`);
  }
  for (const v of list) {
    if (!values.includes(v)) {
      r.error(where, `Question “${q.id}” has no option with value "${v}". Its options are: ${values.join(", ")}.`);
    }
  }
}

function checkUi(r, ui) {
  if (ui === undefined) return;
  if (!isPlainObject(ui)) {
    r.error("ui", `"ui" must be an object of button/label texts.`);
    return;
  }
  for (const [k, v] of Object.entries(ui)) {
    if (k.startsWith("_")) continue;
    if (!(k in DEFAULT_UI)) r.warn(loc("ui", k), `Unknown label "${k}" will be ignored.`);
    else if (typeof v !== "string") r.error(loc("ui", k), `Must be text.`);
  }
}

export function validateContent(c, { today } = {}) {
  const r = new Report();

  if (!isPlainObject(c)) {
    r.error("file", "The content file must be one JSON object, starting with { and ending with }.");
    return r;
  }
  checkKeys(r, c, TOP_KEYS, "top level");

  if (c.schemaVersion === undefined) {
    r.warn("schemaVersion", `Add "schemaVersion": ${SCHEMA_VERSION} at the top so future versions of the template know how to read this file.`);
  } else if (c.schemaVersion !== SCHEMA_VERSION) {
    r.error("schemaVersion", `This template understands schemaVersion ${SCHEMA_VERSION}, but the file says ${JSON.stringify(c.schemaVersion)}.`);
  }

  /* ---- meta ---- */
  const meta = c.meta;
  if (!isPlainObject(meta)) {
    r.error("meta", `"meta" is missing. It holds the title and the "as of" date.`);
  } else {
    checkKeys(r, meta, ["title", "subtitle", "description", "asOf", "sample", "lang", "utcOffset", "timeZoneLabel", "channel"], "meta");
    if (!isNonEmptyString(meta.title)) r.error(loc("meta", "title"), "The explainer needs a title.");
    if (meta.subtitle !== undefined && !isNonEmptyString(meta.subtitle)) r.error(loc("meta", "subtitle"), "Must be text (or remove it).");
    if (!isValidDate(meta.asOf)) {
      r.error(loc("meta", "asOf"), `Needs the date the information was last checked, written as YYYY-MM-DD (for example "2026-11-01").`);
    } else if (today && isValidDate(today)) {
      const days = (Date.parse(today) - Date.parse(meta.asOf)) / 86400000;
      if (days > 180) r.warn(loc("meta", "asOf"), `The information was last checked more than 6 months ago (${meta.asOf}). Time to re-check the facts?`);
      if (days < 0) r.warn(loc("meta", "asOf"), `The "as of" date (${meta.asOf}) is in the future.`);
    }
    if (meta.sample !== undefined && typeof meta.sample !== "boolean") r.error(loc("meta", "sample"), "Must be true or false.");
    if (meta.utcOffset !== undefined && !OFFSET_RE.test(meta.utcOffset)) {
      r.error(loc("meta", "utcOffset"), `Must look like "+08:00" (Philippine time) or "-05:00".`);
    }
    if (meta.channel !== undefined) {
      if (!isPlainObject(meta.channel)) r.error(loc("meta", "channel"), `Must be an object with "name", "handle" and "url".`);
      else {
        checkKeys(r, meta.channel, ["name", "handle", "url"], loc("meta", "channel"));
        if (meta.channel.url !== undefined && !/^https:\/\//.test(meta.channel.url)) {
          r.error(loc("meta", "channel", "url"), "Must start with https://");
        }
      }
    }
  }

  checkUi(r, c.ui);

  /* ---- intro ---- */
  if (!isPlainObject(c.intro)) {
    r.error("intro", `"intro" is missing. It needs at least a "body" with a few sentences explaining the topic.`);
  } else {
    checkKeys(r, c.intro, ["heading", "body", "timeNote"], "intro");
    if (!isText(c.intro.body)) r.error(loc("intro", "body"), "Needs some text: one sentence, or a list of paragraphs.");
    if (c.intro.heading !== undefined && !isNonEmptyString(c.intro.heading)) r.error(loc("intro", "heading"), "Must be text (or remove it).");
  }

  /* ---- sources (checked early so other parts can refer to them) ---- */
  const sourceIds = new Set();
  const usedSources = new Set();
  if (!Array.isArray(c.sources) || c.sources.length === 0) {
    r.error("sources", `"sources" is missing or empty. Every explainer should list where its facts come from.`);
  } else {
    c.sources.forEach((s, i) => {
      const where = loc("sources", itemLabel(i, s));
      if (!isPlainObject(s)) return r.error(where, "Each source must be an object.");
      checkKeys(r, s, ["id", "title", "publisher", "url", "accessed", "note"], where);
      if (!isNonEmptyString(s.id) || !ID_RE.test(s.id)) r.error(where, `Needs an "id" made of letters, numbers, - or _ (for example "s1").`);
      else if (sourceIds.has(s.id)) r.error(where, `The id "${s.id}" is used twice. Each source needs its own id.`);
      else sourceIds.add(s.id);
      if (!isNonEmptyString(s.title)) r.error(where, `Needs a "title".`);
      if (s.url !== undefined && !/^https?:\/\/\S+$/.test(s.url)) r.error(where, `"url" must be a full web address starting with https://`);
      if (s.accessed !== undefined && !isValidDate(s.accessed)) r.error(where, `"accessed" must be a date written as YYYY-MM-DD.`);
    });
  }

  /* ---- questions ---- */
  const questionMap = new Map();
  const allQuestionIds = new Set(
    Array.isArray(c.questions) ? c.questions.filter(isPlainObject).map((q) => q.id) : []
  );
  if (!Array.isArray(c.questions) || c.questions.length === 0) {
    r.error("questions", `"questions" is missing or empty. Add at least one question for the checker.`);
  } else {
    c.questions.forEach((q, i) => {
      const where = loc("questions", itemLabel(i, q));
      if (!isPlainObject(q)) return r.error(where, "Each question must be an object.");
      checkKeys(r, q, ["id", "text", "help", "type", "options", "showIf", "optional"], where);
      // showIf may only look at earlier questions
      checkCondition(r, q.showIf, questionMap, loc(where, "showIf"), allQuestionIds);
      if (!isNonEmptyString(q.id) || !ID_RE.test(q.id)) r.error(where, `Needs an "id" made of letters, numbers, - or _ (for example "age").`);
      else if (questionMap.has(q.id)) r.error(where, `The id "${q.id}" is used by two questions.`);
      if (!isNonEmptyString(q.text)) r.error(where, `Needs "text" (the question itself).`);
      if (q.type !== undefined && !["single", "multi"].includes(q.type)) r.error(where, `"type" must be "single" (pick one) or "multi" (pick any).`);
      if (q.optional !== undefined && typeof q.optional !== "boolean") r.error(where, `"optional" must be true or false.`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        r.error(where, `Needs "options" with at least 2 answer choices.`);
      } else {
        const seen = new Set();
        q.options.forEach((o, j) => {
          const ow = loc(where, `option #${j + 1}`);
          if (!isPlainObject(o)) return r.error(ow, `Each option needs "value" and "label".`);
          checkKeys(r, o, ["value", "label", "help"], ow);
          if (!isNonEmptyString(o.value) || !ID_RE.test(o.value)) r.error(ow, `Needs a "value" made of letters, numbers, - or _ (used in rules).`);
          else if (seen.has(o.value)) r.error(ow, `The value "${o.value}" is used twice in this question.`);
          else seen.add(o.value);
          if (!isNonEmptyString(o.label)) r.error(ow, `Needs a "label" (the text people see).`);
        });
      }
      if (isNonEmptyString(q.id) && !questionMap.has(q.id)) questionMap.set(q.id, { ...q, type: q.type || "single" });
    });
  }

  /* ---- result blocks ---- */
  const blockIds = new Set();
  const usedBlocks = new Set();
  if (!Array.isArray(c.resultBlocks) || c.resultBlocks.length === 0) {
    r.error("resultBlocks", `"resultBlocks" is missing or empty. These are the pieces of the personalized result.`);
  } else {
    c.resultBlocks.forEach((b, i) => {
      const where = loc("resultBlocks", itemLabel(i, b));
      if (!isPlainObject(b)) return r.error(where, "Each result block must be an object.");
      checkKeys(r, b, ["id", "title", "body", "tone", "sources"], where);
      if (!isNonEmptyString(b.id) || !ID_RE.test(b.id)) r.error(where, `Needs an "id" made of letters, numbers, - or _.`);
      else if (blockIds.has(b.id)) r.error(where, `The id "${b.id}" is used by two result blocks.`);
      else blockIds.add(b.id);
      if (!isNonEmptyString(b.title)) r.error(where, `Needs a "title".`);
      if (!isText(b.body)) r.error(where, `Needs a "body": one sentence, or a list of paragraphs.`);
      if (b.tone !== undefined && !TONES.includes(b.tone)) r.error(where, `"tone" must be one of: ${TONES.join(", ")}.`);
      checkSourceRefs(r, b.sources, sourceIds, usedSources, where);
    });
  }

  /* ---- rules ---- */
  if (!Array.isArray(c.rules) || c.rules.length === 0) {
    r.error("rules", `"rules" is missing or empty. Rules connect answers to result blocks.`);
  } else {
    c.rules.forEach((rule, i) => {
      const where = loc("rules", `#${i + 1}`);
      if (!isPlainObject(rule)) return r.error(where, "Each rule must be an object.");
      checkKeys(r, rule, ["when", "show", "stop", "note"], where);
      if (rule.when === undefined) r.error(where, `Needs "when" (the condition). Use "always" for a rule that always applies.`);
      else checkCondition(r, rule.when, questionMap, loc(where, "when"));
      if (!Array.isArray(rule.show) || rule.show.length === 0) {
        r.error(where, `Needs "show": a list of result block ids, like ["eligible"].`);
      } else {
        for (const id of rule.show) {
          if (!blockIds.has(id)) r.error(where, `Wants to show result block "${id}", but no result block has that id.`);
          else usedBlocks.add(id);
        }
      }
      if (rule.stop !== undefined && typeof rule.stop !== "boolean") r.error(where, `"stop" must be true or false.`);
    });
  }

  for (const key of ["fallbackResult", "skippedResult"]) {
    if (c[key] === undefined) continue;
    if (!blockIds.has(c[key])) r.error(key, `Points to result block "${c[key]}", but no result block has that id.`);
    else usedBlocks.add(c[key]);
  }
  if (c.fallbackResult === undefined) {
    r.warn("fallbackResult", `No "fallbackResult" set. If no rule matches, people will see an empty result. Add a general result block and point "fallbackResult" to it.`);
  }

  /* ---- checklist ---- */
  if (!isPlainObject(c.checklist)) {
    r.error("checklist", `"checklist" is missing. It needs "items": a list of things to do or bring.`);
  } else {
    checkKeys(r, c.checklist, ["heading", "intro", "items"], "checklist");
    if (!Array.isArray(c.checklist.items) || c.checklist.items.length === 0) {
      r.error(loc("checklist", "items"), "Add at least one checklist item.");
    } else {
      c.checklist.items.forEach((it, i) => {
        const where = loc("checklist", "items", `#${i + 1}`);
        if (!isPlainObject(it)) return r.error(where, `Each item must be an object with "text".`);
        checkKeys(r, it, ["text", "detail", "when", "sources"], where);
        if (!isNonEmptyString(it.text)) r.error(where, `Needs "text".`);
        checkCondition(r, it.when, questionMap, loc(where, "when"));
        checkSourceRefs(r, it.sources, sourceIds, usedSources, where);
      });
    }
  }

  /* ---- deadlines (optional) ---- */
  if (c.deadlines !== undefined) {
    if (!isPlainObject(c.deadlines) || !Array.isArray(c.deadlines.items)) {
      r.error("deadlines", `"deadlines" must be an object with "items" (a list). Remove "deadlines" entirely if the topic has none.`);
    } else {
      checkKeys(r, c.deadlines, ["heading", "intro", "items"], "deadlines");
      c.deadlines.items.forEach((d, i) => {
        const where = loc("deadlines", "items", `#${i + 1}`);
        if (!isPlainObject(d)) return r.error(where, `Each deadline must be an object with "title" and "date".`);
        checkKeys(r, d, ["title", "date", "time", "description", "countdown", "when", "sources"], where);
        if (!isNonEmptyString(d.title)) r.error(where, `Needs a "title".`);
        if (!isValidDate(d.date)) r.error(where, `"date" must be a real date written as YYYY-MM-DD.`);
        if (d.time !== undefined && !TIME_RE.test(d.time)) r.error(where, `"time" must be 24-hour time like "17:00".`);
        if (d.countdown !== undefined && typeof d.countdown !== "boolean") r.error(where, `"countdown" must be true or false.`);
        checkCondition(r, d.when, questionMap, loc(where, "when"));
        checkSourceRefs(r, d.sources, sourceIds, usedSources, where);
      });
    }
  }

  /* ---- FAQ ---- */
  if (!isPlainObject(c.faq) || !Array.isArray(c.faq.items) || c.faq.items.length === 0) {
    r.error("faq", `"faq" is missing. It needs "items": a list of { "question", "answer" }.`);
  } else {
    checkKeys(r, c.faq, ["heading", "items"], "faq");
    c.faq.items.forEach((f, i) => {
      const where = loc("faq", "items", `#${i + 1}`);
      if (!isPlainObject(f)) return r.error(where, `Each FAQ item needs "question" and "answer".`);
      checkKeys(r, f, ["question", "answer", "sources"], where);
      if (!isNonEmptyString(f.question)) r.error(where, `Needs "question".`);
      if (!isText(f.answer)) r.error(where, `Needs "answer".`);
      checkSourceRefs(r, f.sources, sourceIds, usedSources, where);
    });
  }

  /* ---- disclaimer ---- */
  if (!isText(c.disclaimer)) {
    r.error("disclaimer", `"disclaimer" is missing. Add a short note, e.g. that this is a guide and not legal advice.`);
  }

  /* ---- signup (optional) ---- */
  const s = c.signup;
  if (s !== undefined) {
    if (!isPlainObject(s)) {
      r.error("signup", `"signup" must be an object. Remove it, or set "enabled": false, to turn the sign-up off.`);
    } else {
      checkKeys(r, s, ["enabled", "heading", "body", "formAction", "emailEntry", "consentEntry", "consentValue", "consentLabel", "privacyNotice", "privacyUrl", "extraFields", "submitLabel", "successMessage"], "signup");
      if (typeof s.enabled !== "boolean") r.error(loc("signup", "enabled"), "Must be true or false.");
      if (s.enabled === true) {
        if (!isNonEmptyString(s.heading)) r.error(loc("signup", "heading"), "Needs a heading, e.g. “Get updates on this topic”.");
        if (typeof s.formAction !== "string" || !FORM_RE.test(s.formAction.replace("YOUR_FORM_ID", "x"))) {
          r.error(loc("signup", "formAction"), `Must be your Google Form's address ending in /formResponse, like https://docs.google.com/forms/d/e/1FAIp…/formResponse`);
        }
        for (const key of ["emailEntry", "consentEntry"]) {
          if (typeof s[key] !== "string" || !ENTRY_RE.test(s[key])) {
            r.error(loc("signup", key), `Must be a Google Form entry id like "entry.1234567890". See the README for how to find it.`);
          }
        }
        if (s.emailEntry && s.emailEntry === s.consentEntry) r.error("signup", `"emailEntry" and "consentEntry" must be different.`);
        if (!isNonEmptyString(s.consentLabel)) r.error(loc("signup", "consentLabel"), `Needs the consent checkbox text, e.g. “I agree to receive emails from Nice to Know.”`);
        if (!isText(s.privacyNotice)) r.error(loc("signup", "privacyNotice"), `A privacy notice is required when sign-up is on. Say what you collect, why, and how to unsubscribe.`);
        if (s.consentValue !== undefined && !isNonEmptyString(s.consentValue)) r.error(loc("signup", "consentValue"), "Must be text matching the checkbox option in your Google Form.");
        if (s.privacyUrl !== undefined && !/^https:\/\/\S+$/.test(s.privacyUrl)) r.error(loc("signup", "privacyUrl"), "Must start with https://");
        if (s.extraFields !== undefined) {
          if (!isPlainObject(s.extraFields)) r.error(loc("signup", "extraFields"), `Must be an object like { "entry.123": "topic-name" }.`);
          else for (const [k, v] of Object.entries(s.extraFields)) {
            if (!ENTRY_RE.test(k) || typeof v !== "string") r.error(loc("signup", "extraFields"), `"${k}" must be an entry id like "entry.123" with a text value.`);
          }
        }
        if (isSignupPlaceholder(s)) {
          r.warn("signup", `The sign-up still uses placeholder values (YOUR_FORM_ID / entry.0000000000). The form will show as "preview only" and nothing will be sent until you add your real Google Form details.`);
        }
      }
    }
  }

  /* ---- friendly extra checks ---- */
  for (const id of sourceIds) {
    if (!usedSources.has(id)) r.warn(loc("sources", `“${id}”`), `This source is listed but nothing refers to it. Is that on purpose?`);
  }
  for (const id of blockIds) {
    if (!usedBlocks.has(id)) r.warn(loc("resultBlocks", `“${id}”`), `No rule shows this result block, so nobody will ever see it.`);
  }
  if (meta && meta.sample !== true && typeof meta.title === "string" && /sample|fictional|demo/i.test(meta.title)) {
    r.warn(loc("meta", "sample"), `The title looks like sample content, but "sample" is not true, so the SAMPLE banner is hidden.`);
  }

  return r;
}
