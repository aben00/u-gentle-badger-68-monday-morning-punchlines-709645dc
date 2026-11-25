// Monday Morning Punchlines — make.fun entry
// Writes a single joke about Monday mornings to /output/entry.txt:
// one line, 1–200 characters, deterministic on every run.

import fs from "node:fs";
import path from "node:path";

// The joke itself: 112 characters, one line. The setup borrows the
// week's loading screen, then the punchline turns the annoyance up a
// notch — Monday doesn't just stall, it makes you sit through the ads.
const ENTRY =
  "Monday morning is the week’s loading screen: it freezes, it buffers, and it still makes you sit through the ads.";

const OUTPUT_PATH = process.env.OUTPUT_PATH || "/output/entry.txt";
const MAX_CHARS = 200;

function checkGate(text: string): string[] {
  const violations: string[] = [];
  if (typeof text !== "string") {
    return ["entry is not a string"];
  }
  const chars = Array.from(text);
  if (chars.length < 1 || chars.length > MAX_CHARS) {
    violations.push(
      `entry is ${chars.length} characters, must be 1-${MAX_CHARS}`,
    );
  }
  if (text.trim().length === 0) {
    violations.push("entry is only whitespace");
  }
  if (text !== text.trim()) {
    violations.push("entry must not start or end with whitespace");
  }
  for (const ch of chars) {
    const code = ch.codePointAt(0)!;
    if (code < 0x20 || code === 0x7f) {
      violations.push(
        `entry must not contain control characters (U+${code.toString(16).padStart(4, "0")})`,
      );
      break;
    }
  }
  if (text.includes("\n") || text.includes("\r")) {
    violations.push("entry must be a single line");
  }
  const roundTrip = new TextDecoder("utf-8", { fatal: true }).decode(
    new TextEncoder().encode(text),
  );
  if (roundTrip !== text) {
    violations.push("entry is not stable UTF-8 text");
  }
  return violations;
}

function main(): void {
  const violations = checkGate(ENTRY);
  if (violations.length > 0) {
    throw new Error(`gate failed: ${violations.join("; ")}`);
  }
  const dir = path.dirname(OUTPUT_PATH);
  fs.mkdirSync(dir, { recursive: true });
  // Write exactly the line, no trailing newline, so the file holds
  // byte-for-byte the single joke and nothing else.
  fs.writeFileSync(OUTPUT_PATH, ENTRY, "utf8");
  fs.chmodSync(OUTPUT_PATH, 0o644);
  const back = fs.readFileSync(OUTPUT_PATH, "utf8");
  if (back !== ENTRY) {
    throw new Error("read-back mismatch: file does not equal entry");
  }
  if (Buffer.byteLength(back, "utf8") !== Buffer.byteLength(ENTRY, "utf8")) {
    throw new Error("read-back byte length mismatch");
  }
  // Re-run the gate on what was actually read back, so a write that
  // silently altered the text is caught here, not by the grader.
  const backViolations = checkGate(back);
  if (backViolations.length > 0) {
    throw new Error(`read-back gate failed: ${backViolations.join("; ")}`);
  }
  console.log(`Wrote ${OUTPUT_PATH} (${Array.from(ENTRY).length} chars):`);
  console.log(back);
}

main();
