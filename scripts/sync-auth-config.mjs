/** Sync only public browser-login routing from the selected Infisical environment. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const environment = process.argv[2] ?? "dev";
if (!["dev", "prod"].includes(environment)) throw new Error("환경은 dev 또는 prod여야 합니다.");
const project = process.env.INFISICAL_PROJECT_ID;
if (!project) throw new Error("INFISICAL_PROJECT_ID를 지정해주세요.");
const result = execFileSync("infisical", ["secrets", "get", "GOOGLE_OAUTH_REDIRECT_URI", "OAUTH_SUCCESS_REDIRECT", "--env=" + environment, "--projectId=" + project, "--output=json", "--silent"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const entries = JSON.parse(result);
const values = Object.fromEntries(entries.map((item) => [item.secretKey, item.secretValue]));
const callback = new URL(values.GOOGLE_OAUTH_REDIRECT_URI);
const success = new URL(values.OAUTH_SUCCESS_REDIRECT);
if (callback.protocol !== "https:" || success.protocol !== "https:") throw new Error("등록된 HTTPS 로그인 주소가 필요합니다.");
const updates = { AUTH_API_URL: callback.origin, OAUTH_SUCCESS_REDIRECT: success.href };
let content = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
for (const [key, value] of Object.entries(updates)) {
  const line = key + "=" + value;
  const pattern = new RegExp("^" + key + "=.*$", "m");
  content = pattern.test(content) ? content.replace(pattern, () => line) : content.trimEnd() + "\n" + line + "\n";
}
writeFileSync(".env.local", content, { mode: 0o600 });
console.log("로그인 공개 주소 두 항목을 동기화했습니다. 개발 서버를 다시 시작해주세요.");
