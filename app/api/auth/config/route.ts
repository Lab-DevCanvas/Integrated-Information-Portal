/** Only public login routing configuration may leave this endpoint. */
export function GET() {
  const apiBaseUrl = process.env.AUTH_API_URL?.trim() || "https://integrated-info.kro.kr";
  const successRedirect = process.env.OAUTH_SUCCESS_REDIRECT?.trim() || "https://integrated-information-portal.vercel.app";
  return Response.json({ apiBaseUrl, successRedirect }, { headers: { "Cache-Control": "no-store" } });
}
