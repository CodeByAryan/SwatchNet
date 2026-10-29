/**
 * Small testable logout boundary: revoke the Neon Auth SDK session first, then
 * clear the application's cached profile only after sign-out succeeds.
 */
export async function signOutAndClearNeonSession(
  client: { signOut: () => Promise<unknown> },
  clearLocalSession: () => void,
): Promise<void> {
  const result = await client.signOut();
  const resultRecord = result as { error?: { message?: string } | null } | null;
  const error = resultRecord?.error;
  if (error) throw new Error(error.message ?? "Neon Auth sign-out failed.");
  clearLocalSession();
}
