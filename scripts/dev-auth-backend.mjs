/** Run a loopback-only development API using only its required Infisical secrets. */
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
const project = process.env.INFISICAL_PROJECT_ID;
if (!project) throw new Error("INFISICAL_PROJECT_ID를 지정해주세요.");
const root = resolve(process.env.CRAWLING_REPO_DIR || "../crawling");
const keys = ["DATABASE_URL", "MONGODB_URI", "MONGODB_DB_NAME", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"];
let entries;
try {
  entries = JSON.parse(execFileSync("infisical", ["secrets", "get", ...keys, "--env=dev", "--projectId=" + project, "--output=json", "--silent"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
} catch { throw new Error("Infisical dev의 로그인 필수 설정을 읽지 못했습니다. 로그인과 프로젝트 권한을 확인해주세요."); }
const values = Object.fromEntries(entries.filter((item) => keys.includes(item.secretKey)).map((item) => [item.secretKey, item.secretValue]));
if (keys.some((key) => !values[key] || ["test", "dummy", "changeme"].includes(values[key].trim().toLowerCase()))) throw new Error("로그인 필수 설정이 비어 있거나 임시값입니다.");
const env = { ...process.env, ...values,
  API_ENV: "local", JWT_SECRET: randomBytes(48).toString("base64url"),
  GOOGLE_OAUTH_REDIRECT_URI: "http://localhost:8000/auth/google/callback",
  OAUTH_SUCCESS_REDIRECT: "http://localhost:3000/login",
  OAUTH_COOKIE_CROSS_SITE: "false", CORS_ALLOW_ORIGINS: '["http://localhost:3000"]',
  AUTH_ENFORCEMENT_ENABLED: "true", AI_SEARCH_ENABLED: "false", AI_INDEX_EVENTS_ENABLED: "false",
};
if (process.argv.includes("--migrate")) {
  const result = spawnSync(resolve(root, ".venv/bin/python"), ["-m", "alembic", "upgrade", "head"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) { console.error("개발 DB 마이그레이션 실패. 서버를 시작하지 않습니다."); process.exit(1); }
  console.log("개발 DB 스키마 업데이트 완료");
}
console.log("개발 인증 API를 http://localhost:8000 에 실행합니다. dev 저장소를 사용하며 인증 키는 프로세스 수명 동안만 유지됩니다.");
console.log("Google 승인 리디렉션 URI: http://localhost:8000/auth/google/callback");
const child = spawn(resolve(root, ".venv/bin/python"), ["-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", "8000", "--no-access-log"], { cwd: root, env, stdio: "inherit" });
child.on("error", () => { console.error("백엔드 실행 실패: 저장소 경로와 Python 환경을 확인해주세요."); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
