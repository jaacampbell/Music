// Clean only ChatGPT-attributed page navigation URLs.
// Preserve other query parameters, tokens, path names and fragments.
export default function stripChatgptUtm(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return;
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) return;

  const url = new URL(request.url);
  if (url.searchParams.get("utm_source") !== "chatgpt.com") return;
  url.searchParams.delete("utm_source");
  return Response.redirect(url, 302);
}

export const config = { path: "/*" };
