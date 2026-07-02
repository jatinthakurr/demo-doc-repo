#!/usr/bin/env node
// ai-docs.js ??? OWN Documentation Agent connector
// Written by connect-repo. Runs inside GitHub Actions after checkout.
// Zero dependencies ??? only built-in Node.js modules.

"use strict";
const { execSync } = require("child_process");
const fs    = require("fs");
const path  = require("path");
const https = require("https");
const http  = require("http");

const WEBHOOK_URL = process.env.OWN_DOCS_WEBHOOK_URL   || "";
const SECRET      = process.env.OWN_DOCS_WEBHOOK_SECRET || "";
const REPO        = process.env.GITHUB_REPOSITORY       || "";
const BRANCH      = process.env.GITHUB_REF_NAME         || "main";

const SOURCE_EXTS  = /\.(ts|tsx|js|jsx|py|go|rs|java|rb|php|cs|cpp|c|h)$/;
const IGNORE_PATS  = /(node_modules|__tests__|\.test\.|\.spec\.|\.d\.ts$|\/dist\/|\/build\/|\/.next\/)/ ;

if (!WEBHOOK_URL || !SECRET) {
  console.error("ERROR: OWN_DOCS_WEBHOOK_URL and OWN_DOCS_WEBHOOK_SECRET must be set.");
  process.exit(1);
}

function shell(cmd) {
  try { return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).trim(); } catch { return ""; }
}

function getMode() {
  if (process.env.DOC_MODE) return process.env.DOC_MODE;
  const msg = shell("git log -1 --pretty=%B");
  if (msg.includes("setup: connect to AI documentation pipeline")) return "init";
  return "update";
}

function scanDir(dir, root) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    const rel  = path.relative(root, full).replace(/\\/g, "/");
    if (IGNORE_PATS.test(rel)) continue;
    if (e.isDirectory()) results.push(...scanDir(full, root));
    else if (SOURCE_EXTS.test(e.name)) results.push(rel);
  }
  return results;
}

function getChangedFiles() {
  const before = process.env.GITHUB_EVENT_BEFORE || "";
  const after  = process.env.GITHUB_SHA          || "HEAD";
  const base   = (!before || before === "0000000000000000000000000000000000000000") ? "HEAD~1" : before;
  const out    = shell('git diff --name-only "' + base + '" "' + after + '"');
  return out.split("\n").filter(function(f) { return f && SOURCE_EXTS.test(f) && !IGNORE_PATS.test(f); });
}

function readReadme(cwd) {
  var names = ["README.md", "readme.md", "Readme.md"];
  for (var i = 0; i < names.length; i++) {
    try { return fs.readFileSync(path.join(cwd, names[i]), "utf8").slice(0, 5000); } catch {}
  }
  return "";
}

var cwd   = process.cwd();
var mode  = getMode();
var paths = mode === "init" ? scanDir(cwd, cwd) : getChangedFiles();

console.log("AI Docs -- mode: " + mode.toUpperCase() + ", " + paths.length + " file(s) found");

if (paths.length === 0) {
  console.log("Nothing to document. Skipping.");
  process.exit(0);
}

var file_contents = paths.slice(0, 100).map(function(fp) {
  try {
    var content = fs.readFileSync(path.join(cwd, fp), "utf8").trim();
    return content ? { path: fp, content: content } : null;
  } catch { return null; }
}).filter(Boolean);

var readme  = readReadme(cwd);
var payload = JSON.stringify({
  repo:          REPO,
  branch:        BRANCH,
  changed_files: file_contents.map(function(f) { return f.path; }),
  file_contents: file_contents,
  readme:        readme,
});

var webhookFull = WEBHOOK_URL.endsWith("/api/webhooks/generate-docs")
  ? WEBHOOK_URL
  : WEBHOOK_URL.replace(/\/$/, "") + "/api/webhooks/generate-docs";

var url       = new URL(webhookFull);
var transport = url.protocol === "https:" ? https : http;

var options = {
  hostname: url.hostname,
  port:     url.port || (url.protocol === "https:" ? 443 : 80),
  path:     url.pathname,
  method:   "POST",
  headers: {
    "Content-Type":               "application/json",
    "Authorization":              "Bearer " + SECRET,
    "ngrok-skip-browser-warning": "true",
    "Content-Length":             Buffer.byteLength(payload),
  },
};

var MAX_RETRIES = 3;
var attempt = 0;

function sendWithRetry() {
  attempt++;
  if (attempt === 1) {
    console.log("Sending " + file_contents.length + " file(s) to documentation pipeline...");
  } else {
    console.log("Retry attempt " + attempt + "/" + MAX_RETRIES + "...");
  }

  var req = transport.request(options, function(res) {
    var body = "";
    res.on("data", function(d) { body += d; });
    res.on("end", function() {
      if (res.statusCode >= 500 && attempt < MAX_RETRIES) {
        console.error("Webhook returned " + res.statusCode + " -- retrying in 3s...");
        setTimeout(sendWithRetry, 3000);
        return;
      }
      if (res.statusCode >= 400) {
        console.error("Webhook error " + res.statusCode + ": " + body);
        process.exit(1);
      }
      try {
        var r = JSON.parse(body);
        console.log("\n------------------------------------------");
        console.log("  Documentation Pipeline Result");
        console.log("------------------------------------------");
        if (r.mode === "create") {
          console.log("  Mode    : CREATE");
          console.log("  Title   : " + (r.doc_title   || "Untitled"));
          console.log("  Files   : " + (r.files_analyzed || 0) + " analyzed");
          if (r.sections_created && r.sections_created.length) {
            console.log("\n  Sections created:");
            r.sections_created.forEach(function(s) { console.log("    + " + s); });
          }
        } else {
          console.log("  Mode : UPDATE");
          (r.files || []).forEach(function(f) {
            var secs = f.sections_updated && f.sections_updated.length
              ? " [" + f.sections_updated.join(", ") + "]" : "";
            console.log("  " + f.file + " -> " + f.status + secs);
          });
        }
        console.log("------------------------------------------");
      } catch (e) { console.log(body); }
    });
  });

  req.on("error", function(e) {
    if (attempt < MAX_RETRIES) {
      console.error("Request failed: " + e.message + " -- retrying in 3s...");
      setTimeout(sendWithRetry, 3000);
      return;
    }
    console.error("Request failed after " + MAX_RETRIES + " attempts: " + e.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
}

sendWithRetry();
