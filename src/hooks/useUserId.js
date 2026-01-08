export function useUserId() {
  let userId = sessionStorage.getItem("user_id");
  if (!userId) {
    userId = crypto.randomUUID();
    sessionStorage.setItem("user_id", userId);
  }
  return userId;
}
