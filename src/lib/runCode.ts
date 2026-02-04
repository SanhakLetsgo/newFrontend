/**
 * JavaScript / C++ 코드를 테스트 케이스로 검증합니다.
 * - JavaScript: input 인자를 받아 결과를 return하는 함수 body
 * - C++: stdin에서 입력을 읽고 stdout에 결과를 출력 (표준 입출력)
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const RUN_TIMEOUT_MS = 3000;
const CPP_COMPILE_TIMEOUT_MS = 10000;
const CPP_RUN_TIMEOUT_MS = 2000;

export type TestCase = { input: string; expectedOutput: string };

function normalizeOutput(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function runSingleTest(
  code: string,
  testCase: TestCase,
  timeoutMs: number
): { ok: true; timeMs: number } | { ok: false; message: string } {
  const start = Date.now();
  try {
    const fn = new Function("input", `"use strict";\n${code}`);
    const result = fn(testCase.input);
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) {
      return { ok: false, message: "시간 초과" };
    }
    const got = normalizeOutput(result);
    const expected = testCase.expectedOutput.trim();
    if (got !== expected) {
      return { ok: false, message: `기대: ${expected.slice(0, 50)}${expected.length > 50 ? "…" : ""} / 실제: ${got.slice(0, 50)}${got.length > 50 ? "…" : ""}` };
    }
    return { ok: true, timeMs: elapsed };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, message: err.slice(0, 200) };
  }
}

export type RunResult =
  | { passed: true; executionTimeMs: number }
  | { passed: false; failedIndex: number; message: string };

export function runJavaScriptTests(
  code: string,
  testCases: TestCase[],
  options?: { timeoutMs?: number }
): RunResult {
  const timeoutMs = options?.timeoutMs ?? RUN_TIMEOUT_MS;
  if (!code || !code.trim()) {
    return { passed: false, failedIndex: 0, message: "코드가 비어 있습니다." };
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return { passed: false, failedIndex: 0, message: "테스트 케이스가 없습니다. 출제자가 테스트 케이스를 추가해야 합니다." };
  }
  let totalTimeMs = 0;
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (typeof tc.input !== "string" || typeof tc.expectedOutput !== "string") continue;
    const out = runSingleTest(code, { input: tc.input, expectedOutput: tc.expectedOutput }, timeoutMs);
    if (!out.ok) {
      return { passed: false, failedIndex: i + 1, message: out.message };
    }
    totalTimeMs += out.timeMs;
  }
  return { passed: true, executionTimeMs: totalTimeMs };
}

/**
 * C++ 코드를 컴파일 후 테스트 케이스로 검증합니다.
 * stdin으로 입력을 주고 stdout을 기대 출력과 비교합니다.
 * 서버에 g++ 가 설치되어 있어야 합니다.
 */
export function runCppTests(
  code: string,
  testCases: TestCase[],
  options?: { compileTimeoutMs?: number; runTimeoutMs?: number }
): RunResult {
  const compileTimeout = options?.compileTimeoutMs ?? CPP_COMPILE_TIMEOUT_MS;
  const runTimeout = options?.runTimeoutMs ?? CPP_RUN_TIMEOUT_MS;

  if (!code || !code.trim()) {
    return { passed: false, failedIndex: 0, message: "코드가 비어 있습니다." };
  }
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return { passed: false, failedIndex: 0, message: "테스트 케이스가 없습니다. 출제자가 테스트 케이스를 추가해야 합니다." };
  }

  const tmpDir = os.tmpdir();
  const id = `cpp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const cppPath = path.join(tmpDir, `${id}.cpp`);
  const outPath = path.join(tmpDir, `${id}.out`);

  try {
    fs.writeFileSync(cppPath, code, "utf-8");
    const compile = spawnSync("g++", ["-std=c++17", "-O2", "-o", outPath, cppPath], {
      encoding: "utf-8",
      timeout: compileTimeout,
      cwd: tmpDir,
    });
    if (compile.status !== 0) {
      const stderr = (compile.stderr || compile.error?.message || "").slice(0, 300);
      return { passed: false, failedIndex: 0, message: `컴파일 실패: ${stderr || "알 수 없는 오류"}` };
    }

    let totalTimeMs = 0;
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (typeof tc.input !== "string" || typeof tc.expectedOutput !== "string") continue;
      const start = Date.now();
      const run = spawnSync(outPath, [], {
        input: tc.input,
        encoding: "utf-8",
        timeout: runTimeout,
        maxBuffer: 2 * 1024 * 1024,
      });
      const elapsed = Date.now() - start;
      if (run.signal === "SIGTERM" || run.error?.message?.includes("ETIMEDOUT")) {
        return { passed: false, failedIndex: i + 1, message: "시간 초과" };
      }
      const got = (run.stdout ?? "").trim().replace(/\r\n/g, "\n");
      const expected = tc.expectedOutput.trim().replace(/\r\n/g, "\n");
      if (got !== expected) {
        return {
          passed: false,
          failedIndex: i + 1,
          message: `기대: ${expected.slice(0, 80)}${expected.length > 80 ? "…" : ""} / 실제: ${got.slice(0, 80)}${got.length > 80 ? "…" : ""}`,
        };
      }
      if (run.stderr) {
        // 경고만 있고 출력이 맞으면 통과로 처리 (stderr는 무시)
      }
      totalTimeMs += elapsed;
    }
    return { passed: true, executionTimeMs: totalTimeMs };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { passed: false, failedIndex: 0, message: err.slice(0, 200) };
  } finally {
    try {
      if (fs.existsSync(cppPath)) fs.unlinkSync(cppPath);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
