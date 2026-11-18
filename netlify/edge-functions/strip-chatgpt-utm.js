// Remove ChatGPT's auto-appended UTM attribution on document navigation.
// Retains original route, RSVP/auth tokens, checkout parameters and fragments.
export default function stripChatgptUtm(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return;
  const url = new URL(request.url);
  if (url.searchParams.get("utm_source") !== "chatgpt.com") return;
  url.searchParams.delete("utm_source");
  return Response.redirect(url.toString(), 302);
}

export const config = {
  path: "/*",
  method: ["GET", "HEAD"],
  header: { accept: "text/html" },
};
