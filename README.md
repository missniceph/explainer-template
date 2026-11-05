# Nice to Know — Interactive Explainer Template

A reusable template for the interactive explainers from **Nice to Know** ([@missniceph](https://github.com/missniceph)).

Every explainer follows the same path:

**intro → short question checker → personalized result → checklist → deadlines → FAQ → sources → email sign-up**

- **One file per topic.** All the text, questions, rules, dates and sources live in `content/topic.json`. You never have to touch the code.
- **Private by design.** No backend, no analytics, no cookies, no ads. Answers stay in the visitor's browser tab and are never stored or sent. The only thing that ever leaves the page is the optional email sign-up (email + consent), and only when someone presses the button.
- **Free hosting** on GitHub Pages.
- **Safety net.** The page checks the content file when it loads and lists anything missing in plain language. A GitHub check does the same every time you save.
- Mobile first, light and dark mode, keyboard and screen-reader friendly, and the checklist prints neatly.

> The included demo (a library card in the made-up town of Lumen Bay) is **SAMPLE CONTENT – NOT REAL**. Replace it with your own fact-checked content.

---

## What's here and how to update it

| File | What it is | When to change it |
|---|---|---|
| `content/topic.json` | **All the words, questions, rules, dates and sources.** | Every new explainer, and whenever facts change. This is the only file you normally edit. |
| `index.html` | The page shell, including the link-preview lines (title, description, address, share image). | Once per explainer: the lines between the "EDIT FOR EACH EXPLAINER" markers. |
| `assets/share.png` | The image shown when the link is shared (1200 × 630). Made from `assets/share.svg`. | Optional. It's generic, so it works for every explainer as is. |
| `assets/style.css` | Colors and layout. Colors are at the top (one light block, two identical dark blocks). | Only to change the look. |
| `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Browser tab and phone home-screen icons. | Rarely. |
| `assets/app.js`, `assets/engine.js` | The code that draws the page and checks your content. | Not needed. |
| `tools/validate.mjs`, `.github/workflows/` | The automatic ✓/✗ check that runs on GitHub when you save. | Not needed. |

**Updating a live explainer:** open `content/topic.json` on GitHub, click the pencil icon, change the facts, change `"asOf"` to today's date, and click **Commit changes**. Wait for the green ✓. The live page updates within about 10 minutes.

---

## Contents

1. [One-time setup: turn this repo into a template](#1-one-time-setup-turn-this-repo-into-a-template)
2. [Making a new explainer, step by step](#2-making-a-new-explainer-step-by-step)
3. [Setting up the email sign-up (Google Form)](#3-setting-up-the-email-sign-up-google-form)
4. [The content file, fully commented](#4-the-content-file-fully-commented)
5. [Conditions cheat sheet](#5-conditions-cheat-sheet)
6. [Text formatting](#6-text-formatting)
7. [Before you publish: checklist](#7-before-you-publish-checklist)
8. [Troubleshooting](#8-troubleshooting)
9. [Writing in Filipino or Taglish](#9-writing-in-filipino-or-taglish)
10. [Privacy details](#10-privacy-details)

---

## 1. One-time setup: turn this repo into a template

You only do this once.

1. Open this repository on GitHub.
2. Go to **Settings** (top bar) → **General**.
3. Tick **Template repository**.

Now a green **Use this template** button appears on the repo's main page.

---

## 2. Making a new explainer, step by step

### Step 1 — Create a copy

1. On this repo's main page, click **Use this template → Create a new repository**.
2. Name it after the topic, e.g. `passport-renewal`. Short, lowercase, dashes instead of spaces. The name becomes part of the web address.
3. Choose **Public** (needed for free GitHub Pages).
4. Click **Create repository**.

### Step 2 — Turn on the website

1. In the new repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/ (root)**, then **Save**.
4. After a minute or two, the page shows your address:
   `https://missniceph.github.io/passport-renewal/`

At this point the site shows the sample library-card explainer. That's expected.

### Step 3 — Write your content

1. Open `content/topic.json` on GitHub and click the **pencil icon** (Edit).
2. Replace the sample text with your topic. Use [section 4](#4-the-content-file-fully-commented) as your guide: it explains every setting.
3. Very important:
   - Set `"sample": false` in `meta` (this hides the yellow SAMPLE banner).
   - Set `"asOf"` to the date you last checked the facts.
   - Add every source you used, and attach sources to facts.
4. Click **Commit changes**.

**Tip:** It's often easier to write the content first in a doc, then copy it in. Keep the quote marks `"` straight, not curly `“ ”` (Google Docs and Word swap them automatically).

### Step 4 — Check it

- On GitHub, click the **Actions** tab (or look for the ✓ / ✗ next to your latest commit).
  - Green ✓ = the content file is OK.
  - Red ✗ = click it, then **check** to see a plain-language list of what to fix.
- Open your site. If something is wrong, the page shows a friendly list of fixes instead of the explainer.
- To see extra "author warnings" on the live site (unused sources, old "as of" date, etc.), add `?check` to the address: `https://missniceph.github.io/passport-renewal/?check`

### Step 5 — Update the link preview

Facebook, Messenger, Instagram DMs and X read the preview straight from `index.html` (they don't run the page's code). Open `index.html`, find the part between `EDIT FOR EACH EXPLAINER` and `end of the part to edit`, and update these 6 lines:

```html
<title>Passport renewal checker · Nice to Know</title>
<meta name="description" content="Find out what you need to renew…">
<meta property="og:title" content="Passport renewal checker">
<meta property="og:description" content="Find out what you need to renew…">
<meta property="og:url" content="https://missniceph.github.io/passport-renewal/">
<meta property="og:image" content="https://missniceph.github.io/passport-renewal/assets/share.png">
```

In the last two lines, replace `passport-renewal` with your repo's name. If you forget, the GitHub check shows a reminder.

After publishing, paste your link into Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/) and click **Scrape Again** to see the preview and clear Facebook's old copy.

**Changing the share image (optional).** The image is generic ("Answer a few questions. Get your own checklist."), so it fits every explainer. To change the words, edit the text in `assets/share.svg`, open the file in a browser, take a 1200 × 630 screenshot (or use any "SVG to PNG" converter), and save it as `assets/share.png`. Keep it under 300 KB.

### Step 6 — Set up the email sign-up (optional)

See [section 3](#3-setting-up-the-email-sign-up-google-form). If you don't want a sign-up, set `"enabled": false` in `signup` (or delete the whole `signup` part).

### Step 7 — Test on your phone, then share

Go through the checker with a few different answer combinations, check the result makes sense for each one, then share the link.

### Updating later

When the rules change: edit `content/topic.json`, update the facts, sources and `"asOf"` date, and commit. The site updates within about 10 minutes (GitHub publishes in 1–2 minutes, and browsers may keep the old version for up to 10 minutes).

### Preview on your computer (optional)

If you've cloned the repo, open a terminal in the folder and run:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000. (Opening `index.html` directly by double-clicking won't work: browsers block it.) Author warnings are shown automatically on localhost.

To check the content file from the terminal (needs [Node.js](https://nodejs.org)):

```bash
node tools/validate.mjs
```

---

## 3. Setting up the email sign-up (Google Form)

The sign-up sends **only** the email address and the consent answer to a Google Form you own. Responses land in the form's Responses tab (or a linked Google Sheet).

### Create the form

1. Go to [forms.google.com](https://forms.google.com) and create a blank form, e.g. "Nice to Know — updates".
2. Add a **Short answer** question: `Email`.
3. Add a **Checkboxes** question: `Consent`, with one option: `Yes` (this must match `"consentValue"` in your content file exactly).
4. Optional: add a **Short answer** question `Topic` so you know which explainer someone signed up from.
5. In **Settings**, make sure the form does **not** require sign-in and does **not** collect email addresses automatically (otherwise the sign-up from the website will fail).

### Find the form address and entry IDs

1. Click the **⋮** menu → **Get pre-filled link**.
2. Type anything in each field (e.g. `test@test.com`, tick `Yes`, type `topic`) → **Get link** → **Copy link**.
3. Paste the link somewhere. It looks like:

   ```
   https://docs.google.com/forms/d/e/1FAIpQLSf…xyz/viewform?usp=pp_url&entry.1234567890=test@test.com&entry.987654321=Yes&entry.55555555=topic
   ```

4. From that link:
   - **formAction** = everything up to `viewform`, with `viewform` replaced by `formResponse`:
     `https://docs.google.com/forms/d/e/1FAIpQLSf…xyz/formResponse`
   - **emailEntry** = the entry next to your test email: `entry.1234567890`
   - **consentEntry** = the entry next to `Yes`: `entry.987654321`
   - **topic entry** (optional) = `entry.55555555` → use it in `"extraFields"`.

### Put them in the content file

```json
"signup": {
  "enabled": true,
  "heading": "Want a heads-up when this changes?",
  "formAction": "https://docs.google.com/forms/d/e/1FAIpQLSf…xyz/formResponse",
  "emailEntry": "entry.1234567890",
  "consentEntry": "entry.987654321",
  "consentValue": "Yes",
  "consentLabel": "I agree to receive emails from Nice to Know. I can unsubscribe anytime.",
  "privacyNotice": "We only collect your email and consent. …",
  "extraFields": { "entry.55555555": "passport-renewal" }
}
```

### Test it

Sign up on your live site with your own email, then check the form's **Responses** tab.

Good to know:

- The page sends the sign-up with `mode: "no-cors"`. That means Google won't tell the page whether it worked, so the page always shows the success message once the request is sent. **Always test with a real submission** after setting up a new form.
- While the content file still has the placeholders (`YOUR_FORM_ID`, `entry.0000000000`), the form shows **"Preview only"** and sends nothing.
- When sign-up is on, a **consent checkbox** and a **privacy notice** are required. The page refuses to load without them.

---

## 4. The content file, fully commented

This is the full shape of `content/topic.json` with an explanation of every setting.

> ⚠️ **Real JSON files can't contain comments.** The `//` notes below are just for explanation. Don't copy them into `topic.json`. The demo file `content/topic.json` is a clean, working example you can edit directly.
>
> If you want to leave yourself a note inside the real file, use a setting whose name starts with `_`, like `"_note": "check this again in January"`. Those are ignored.

```jsonc
{
  // Always 1 for this version of the template. Leave as is.
  "schemaVersion": 1,

  // ───────────────────────── META ─────────────────────────
  "meta": {
    // REQUIRED. The big title at the top, and the browser tab title.
    "title": "How to get a Lumen Bay library card (sample)",

    // Optional. One line under the title.
    "subtitle": "A made-up guide to a made-up library.",

    // Optional. Used as the page description.
    "description": "SAMPLE CONTENT – NOT REAL. A fictional explainer…",

    // REQUIRED. The date you last checked the facts, as YYYY-MM-DD.
    // Shown as "Information as of November 1, 2026".
    // The checker warns you when this is more than 6 months old.
    "asOf": "2026-11-01",

    // true = show the yellow "SAMPLE CONTENT – NOT REAL" banner.
    // Set to false (or remove) for real explainers.
    "sample": true,

    // Optional. Language code, used for date formatting. "en-PH" gives
    // "November 1, 2026". "fil-PH" gives Filipino month names.
    "lang": "en-PH",

    // Optional. Time zone for deadlines and countdowns.
    // Default is "+08:00" (Philippine time).
    "utcOffset": "+08:00",

    // Optional. Shown after deadline times, e.g. "5:00 PM (PH time)".
    "timeZoneLabel": "PH time",

    // Optional. Shown in the top-left corner. The url is where the logo links to.
    // (The footer always has a "Follow @missniceph on Instagram" link.)
    "channel": {
      "name": "Nice to Know",
      "handle": "@missniceph",
      "url": "https://www.instagram.com/missniceph/"
    }
  },

  // ───────────────────────── UI LABELS (optional) ─────────────────────────
  // Change any button or label text. Leave out anything you don't want to change.
  // {n}, {total}, {date}, {done} are filled in automatically.
  // For a full, ready-to-paste Filipino/Taglish set, see README section 9.
  "ui": {
    "start": "Simulan na",
    "next": "Susunod",
    "back": "Bumalik",
    "seeResult": "Tingnan ang resulta ko",
    "questionOf": "Tanong {n} ng {total}",
    "daysLeft": "{n} araw na lang"
  },

  // ───────────────────────── INTRO ─────────────────────────
  "intro": {
    // Optional heading inside the intro card.
    "heading": "Can you get a library card, and what do you need?",

    // REQUIRED. One sentence, or a list of paragraphs like this:
    "body": [
      "**This is sample content.** Nothing here is real.",
      "Answer 4–5 quick questions to get your personalized result."
    ],

    // Optional. Small note under the Start button.
    "timeNote": "Takes about 1 minute."
  },

  // ───────────────────────── QUESTIONS ─────────────────────────
  // The checker asks these one at a time, in this order. Keep it short:
  // 3–6 questions is ideal.
  "questions": [
    {
      // REQUIRED. A short name for the question, used in rules.
      // Letters, numbers, - and _ only. Never shown to visitors.
      "id": "residence",

      // REQUIRED. The question itself.
      "text": "Where do you live?",

      // Optional. Extra explanation under the question.
      "help": "Lumen Bay is an imaginary seaside town.",

      // Optional. "single" = choose one (default). "multi" = choose all that apply.
      "type": "single",

      // REQUIRED. At least 2 answer choices.
      // "value" = short name used in rules (letters, numbers, - and _).
      // "label" = what visitors see. "help" (optional) = small text under it.
      "options": [
        { "value": "resident", "label": "In Lumen Bay" },
        { "value": "nearby",   "label": "Outside, but I work or study there" },
        { "value": "visitor",  "label": "I'm just visiting" }
      ]
    },
    {
      "id": "proof",
      "text": "Do you have a document with your Lumen Bay address?",

      // Optional. Only ask this question if the condition is true.
      // It can only look at questions that come BEFORE this one.
      // See the "Conditions cheat sheet" in the README.
      "showIf": { "question": "residence", "is": "resident" },

      "options": [
        { "value": "yes", "label": "Yes" },
        { "value": "no",  "label": "No, or not in my name" }
      ]
    },
    {
      "id": "borrow",
      "type": "multi",
      "text": "What would you like to borrow?",

      // Optional. true = visitors may continue without picking anything.
      // Normally they must pick at least one answer.
      "optional": false,

      "options": [
        { "value": "books",   "label": "Books and comics" },
        { "value": "starkit", "label": "The Star Kit", "help": "A small telescope." }
      ]
    }
  ],

  // ───────────────────────── RESULT BLOCKS ─────────────────────────
  // The building blocks of the personalized result. The rules (below)
  // decide which blocks each visitor sees.
  "resultBlocks": [
    {
      // REQUIRED. Short name used in rules.
      "id": "full-card",

      // Optional color/feel of the box:
      //   "good"   = green (good news)
      //   "info"   = blue (neutral, the default)
      //   "warn"   = yellow (careful / limitation)
      //   "action" = orange (something you need to do)
      "tone": "good",

      // REQUIRED.
      "title": "You can get a free Full Card",

      // REQUIRED. One sentence or a list of paragraphs.
      "body": "As a resident, you can get a Full Card for free.",

      // Optional, but strongly recommended: which sources back this up.
      // Use the "id" of entries in "sources". Shown as [1], [2] links.
      "sources": ["rules"]
    },
    {
      "id": "kindly-neighbor",
      "tone": "action",
      "title": "No address document? Use a Kindly Neighbor Letter",
      "body": "Ask a Full Card holder to fill one in for you.",
      "sources": ["rules", "forms"]
    },
    {
      "id": "visitor-pass",
      "tone": "warn",
      "title": "You can get a Visitor Pass (reading room only)",
      "body": "Visitors can read inside the library but can't take items home."
    },
    {
      "id": "general",
      "title": "Here's the general guide",
      "body": "Read the checklist and FAQ below."
    },
    {
      "id": "everything",
      "title": "Everything at a glance",
      "body": "Residents get a free Full Card; visitors get a Visitor Pass."
    }
  ],

  // ───────────────────────── RULES ─────────────────────────
  // Rules connect answers to result blocks. They are checked from top to
  // bottom. EVERY rule whose "when" is true adds its blocks to the result
  // (in this order, no duplicates).
  "rules": [
    {
      // Optional note to yourself. Ignored by the page.
      "note": "Visitors only see the visitor pass.",

      // REQUIRED. When this rule applies. See the Conditions cheat sheet.
      "when": { "question": "residence", "is": "visitor" },

      // REQUIRED. Which result blocks to show (their ids).
      "show": ["visitor-pass"],

      // Optional. true = if this rule applies, don't check any rules below it.
      "stop": true
    },
    { "when": { "question": "residence", "is": "resident" }, "show": ["full-card"] },
    { "when": { "question": "proof", "is": "no" },          "show": ["kindly-neighbor"] }
  ],

  // Recommended. Block shown if NO rule applied.
  "fallbackResult": "general",

  // Optional. Block shown when someone clicks "Skip the questions".
  "skippedResult": "everything",

  // ───────────────────────── CHECKLIST ─────────────────────────
  "checklist": {
    // Optional. Default: "Your checklist".
    "heading": "What to bring",

    // Optional. Text under the heading.
    "intro": "Tick things off as you go. Ticks aren't saved.",

    // REQUIRED. At least one item.
    "items": [
      {
        // REQUIRED. The thing to do or bring.
        "text": "Any ID with your photo",

        // Optional. Smaller text underneath.
        "detail": "A school ID is fine.",

        // Optional. Only show this item when the condition is true.
        // Leave out to always show it.
        // (People who skip the questions see ALL items.)
        "when": { "question": "residence", "isNot": "visitor" },

        // Optional. Sources for this item.
        "sources": ["rules"]
      },
      { "text": "A reusable bag for your books" }
    ]
  },

  // ───────────────────────── DEADLINES (optional) ─────────────────────────
  // Remove this whole part if the topic has no dates.
  // Deadlines are sorted by date automatically.
  "deadlines": {
    "heading": "Important dates",
    "intro": "Dates are in Philippine time.",
    "items": [
      {
        // REQUIRED.
        "title": "Free Card Week ends",

        // REQUIRED. YYYY-MM-DD.
        "date": "2026-12-15",

        // Optional. 24-hour time, e.g. "17:00" for 5 PM.
        // In the last 48 hours, the countdown switches to hours.
        "time": "17:00",

        // Optional.
        "description": "The Neighbor Card fee is waived this week.",

        // Optional. true = show "12 days left" / "Today" / "Passed".
        "countdown": true,

        // Optional. Same as checklist items.
        "when": { "question": "residence", "is": "nearby" },
        "sources": ["fees"]
      }
    ]
  },

  // ───────────────────────── FAQ ─────────────────────────
  "faq": {
    // Optional. Default: "Frequently asked questions".
    "heading": "Frequently asked questions",

    // REQUIRED. At least one.
    "items": [
      {
        "question": "How long does it take?",
        "answer": "About 10 minutes.",   // or a list of paragraphs
        "sources": ["rules"]             // optional
      }
    ]
  },

  // ───────────────────────── SOURCES ─────────────────────────
  // REQUIRED. Where your facts come from. They're numbered [1], [2], … in
  // this order. Refer to them anywhere with "sources": ["id"].
  "sources": [
    {
      "id": "rules",                                      // REQUIRED. Short name.
      "title": "Library Card Rules (fictional)",           // REQUIRED.
      "publisher": "Lumen Bay Public Library",            // optional
      "url": "https://example.org/lumen-bay/card-rules",  // optional, full https:// address
      "accessed": "2026-11-01",                           // optional, when you checked it
      "note": "Section 3, page 2"                         // optional
    },
    { "id": "fees",  "title": "Fees in Bay Tokens (fictional)" },
    { "id": "forms", "title": "Kindly Neighbor Letter (fictional form)" }
  ],

  // ───────────────────────── DISCLAIMER ─────────────────────────
  // REQUIRED. Shown in a "Please note" box, together with the "as of" date.
  "disclaimer": [
    "This is a general guide, not legal, tax or professional advice.",
    "Always check with the official office before acting."
  ],

  // ───────────────────────── EMAIL SIGN-UP (optional) ─────────────────────────
  // See README section 3 for how to get these values from Google Forms.
  "signup": {
    // REQUIRED. false = no sign-up form (everything else below is then ignored).
    "enabled": true,

    // REQUIRED when enabled.
    "heading": "Want a heads-up when this changes?",

    // Optional.
    "body": "One short email when the rules change. No spam.",

    // REQUIRED when enabled. Your form's address ending in /formResponse.
    "formAction": "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",

    // REQUIRED when enabled. The entry ids of the Email and Consent questions.
    "emailEntry": "entry.0000000000",
    "consentEntry": "entry.0000000001",

    // Optional. Must match the checkbox option text in your form. Default "Yes".
    "consentValue": "Yes",

    // REQUIRED when enabled. The text next to the consent checkbox.
    "consentLabel": "I agree to receive emails from Nice to Know. I can unsubscribe anytime.",

    // REQUIRED when enabled. What you collect, why, where it's kept,
    // and how to unsubscribe. One sentence or a list of paragraphs.
    "privacyNotice": [
      "We only collect your email and your consent. Your checker answers are never sent.",
      "Reply \"unsubscribe\" to any email to be removed."
    ],

    // Optional. Link to a full privacy policy page.
    "privacyUrl": "https://example.org/privacy",

    // Optional. Fixed values sent with every sign-up, e.g. which topic it
    // came from. Only fixed text, never anything the visitor answered.
    "extraFields": { "entry.0000000002": "library-card" },

    // Optional. Button text and the message after signing up.
    "submitLabel": "Notify me",
    "successMessage": "Thank you! You're on the list."
  }
}
```

---

## 5. Conditions cheat sheet

Conditions are used in `showIf` (questions), `when` (rules, checklist items, deadlines).

| What you want | Write |
|---|---|
| Answer is X | `{ "question": "age", "is": "adult" }` |
| Answer is not X | `{ "question": "age", "isNot": "adult" }` |
| Answer is one of several | `{ "question": "age", "in": ["child", "teen"] }` |
| Answer is none of these | `{ "question": "age", "notIn": ["child", "teen"] }` |
| Multi-choice: ticked X | `{ "question": "borrow", "is": "seeds" }` |
| Multi-choice: ticked all of these | `{ "question": "borrow", "includesAll": ["books", "seeds"] }` |
| Question was answered / skipped | `{ "question": "proof", "answered": true }` (or `false`) |
| Both / all must be true | `{ "all": [ condition, condition ] }` |
| At least one must be true | `{ "any": [ condition, condition ] }` |
| The opposite | `{ "not": condition }` |
| Always | `"always"` (or just leave out `when`) |

Example: show a block for teens who want the Star Kit:

```json
{
  "when": { "all": [
    { "question": "age", "is": "teen" },
    { "question": "borrow", "is": "starkit" }
  ] },
  "show": ["starkit-adult"]
}
```

Things to know:

- If a question wasn't asked (because of `showIf`), every check on it is **false**, including `isNot`. Only `{ "answered": false }` is true.
- The checker catches typos: if a rule mentions a question id or answer value that doesn't exist, you'll get an error telling you which ones do exist.

---

## 6. Text formatting

In most text (intro, result bodies, checklist, FAQ answers, help text):

| Write | Get |
|---|---|
| `**important**` | **important** |
| `_gentle emphasis_` | _gentle emphasis_ |
| `[official site](https://example.org)` | a link that opens in a new tab |

For several paragraphs, use a list: `"body": ["First paragraph.", "Second paragraph."]`

To use a quote mark inside text, put a backslash before it: `"He said \"hi\""`.

---

## 7. Before you publish: checklist

- [ ] `"sample": false` in `meta`
- [ ] Every fact checked against an **official** source, and the source is listed and attached
- [ ] `"asOf"` set to the date you checked
- [ ] Disclaimer fits the topic
- [ ] Tried every answer path at least once: does each result make sense?
- [ ] Deadlines: dates and times correct, and in the right time zone
- [ ] Sign-up: real form details in place, tested with your own email, privacy notice accurate
- [ ] Link preview lines in `index.html` updated (title, description, og:url, og:image), and checked in Facebook's Sharing Debugger
- [ ] Green ✓ on GitHub, and `?check` shows no surprising warnings
- [ ] Looked at it on a phone, in both light and dark mode

---

## 8. Troubleshooting

**The page says "The content file has a typing mistake".**
The JSON has a syntax error. Most common causes: a missing comma between items, an extra comma after the last item, curly quotes `“ ”` instead of straight `"`, or a `//` comment. The message points to a line number. Pasting the file into any online "JSON validator" also shows the exact spot.

**The page says "This explainer needs a few fixes".**
The file is valid JSON but something is missing or misspelled. Each line in the list tells you where (e.g. `questions › #2 “age” › options`) and what to do.

**"The content file couldn't be loaded".**
Either you opened `index.html` by double-clicking (use the local preview command in step 2, or just use the GitHub Pages link), or the file isn't at `content/topic.json`.

**My changes don't show up.**
GitHub Pages takes 1–2 minutes to publish, and browsers may keep the old version for up to 10 minutes. To see it sooner, add something to the address like `?v=2`, or on a computer press Ctrl+Shift+R (Cmd+Shift+R on Mac).

**The shared link shows the wrong title or image.**
Check the link-preview lines in `index.html` (Step 5), then use Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/) → **Scrape Again**. Facebook keeps old previews until you do this.

**Dark mode stopped being remembered after I edited index.html.**
The small `<script>` in `index.html` is protected by a security fingerprint (the `sha256-…` value in the Content-Security-Policy line). If that script is changed, browsers block it. Undo the change to the script, or ask for help updating the fingerprint.

**Sign-ups don't appear in my Google Form.**
Check: the address ends in `/formResponse` (not `/viewform`); the entry ids match the pre-filled link; `consentValue` matches the checkbox option text exactly; the form doesn't require sign-in or "collect email addresses"; the form is accepting responses.

**I want two explainers in one repo for testing.**
Add another file, e.g. `content/draft.json`, and open `…/?topic=draft`. The main page always uses `content/topic.json`.

---

## 9. Writing in Filipino or Taglish

Each explainer is in one language. Your own content (questions, results, FAQ…) is written in whatever language you like. The buttons and labels the template adds (like "Next" or "3 days left") are English by default. To switch them, paste this into `content/topic.json` right after the `meta` part, and set `"lang": "fil-PH"` in `meta` (this also makes dates show as "Nobyembre 1, 2026"):

```json
"ui": {
  "start": "Simulan na",
  "skip": "I-skip ang mga tanong at ipakita lahat",
  "next": "Susunod",
  "back": "Bumalik",
  "seeResult": "Tingnan ang resulta ko",
  "startOver": "Ulitin mula umpisa",
  "editAnswers": "Baguhin ang mga sagot ko",
  "questionOf": "Tanong {n} ng {total}",
  "chooseOne": "Pumili ng isa",
  "chooseAny": "Puwedeng pumili ng higit sa isa",
  "needAnswer": "Pumili muna ng sagot bago magpatuloy.",
  "resultHeading": "Ang resulta mo",
  "resultIntro": "Base sa mga sagot mo:",
  "resultSkipped": "In-skip mo ang mga tanong, kaya ipinapakita namin lahat sa ibaba. Sagutin ang mga tanong para makita ang resultang para sa'yo.",
  "yourAnswers": "Mga sagot mo",
  "checklistHeading": "Ang checklist mo",
  "checklistPrint": "I-print o i-save bilang PDF",
  "checklistProgress": "{done} sa {total} ang tapos na",
  "deadlinesHeading": "Mga deadline",
  "faqHeading": "Mga madalas itanong",
  "sourcesHeading": "Mga pinagkunan",
  "sourceLabel": "Pinagkunan",
  "sourceAccessed": "Na-check noong {date}",
  "asOf": "Huling na-check: {date}",
  "daysLeft": "{n} araw na lang",
  "dayLeft": "1 araw na lang",
  "hoursLeft": "{n} oras na lang",
  "today": "Ngayong araw na",
  "passed": "Tapos na",
  "privacyLine": "Dito lang sa browser tab na ito ang mga sagot mo. Hindi namin ito itinatago o ipinapadala kahit saan.",
  "sampleBanner": "HALIMBAWA LANG – HINDI TOTOO",
  "disclaimerHeading": "Paalala",
  "signupEmail": "Email address",
  "signupSubmit": "Mag-sign up",
  "signupSending": "Ipinapadala…",
  "signupErrorEmail": "Pakilagay ang tamang email address.",
  "signupErrorConsent": "Paki-check ang consent box para puwede ka naming i-email.",
  "signupErrorNetwork": "May problema. Pakicheck ang internet mo at subukan ulit.",
  "signupPreview": "Preview lang ito: hindi pa naka-connect sa Google Form, kaya walang maipapadala.",
  "signupSuccess": "Salamat! Kasama ka na sa listahan.",
  "privacyPolicy": "Privacy policy",
  "themeToLight": "Lumipat sa light mode",
  "themeToDark": "Lumipat sa dark mode",
  "skipToContent": "Diretso sa content",
  "backToTop": "Bumalik sa itaas ↑",
  "footerNote": "Walang ads, walang tracking, walang cookies.",
  "followUs": "I-follow si @missniceph sa Instagram"
},
```

Change any line to match your own voice. `{n}`, `{total}`, `{done}` and `{date}` are filled in automatically, so keep them as they are.

---

## 10. Privacy details

- **Answers** are kept only in the page's memory while the tab is open. They are not put in the address bar, not saved in the browser, not sent anywhere. Closing or refreshing the tab clears them. Checklist ticks work the same way.
- **The only thing remembered** is the light/dark mode choice, saved in the visitor's own browser (`localStorage`).
- **No outside services** are loaded: no fonts, analytics, trackers or embeds. The page's security policy only allows its own files, plus sending the sign-up to `docs.google.com`.
- **The email sign-up** sends the email address, the consent value and any fixed `extraFields`, and only when the visitor ticks consent and presses the button. It goes to your own Google Form, so Google's privacy policy applies to that data. Say so in your privacy notice.
- **GitHub Pages** itself may keep standard server logs (such as IP addresses) for security, like any web host. See GitHub's privacy statement.
