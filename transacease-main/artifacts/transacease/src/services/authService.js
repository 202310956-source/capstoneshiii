import { supabase, supabaseEnabled } from "./supabase";

const mapAuthError = (error) => {
  const msg = error?.message ?? "";
  if (msg.includes("Invalid login credentials")) return "Wrong email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email before logging in.";
  if (msg.includes("User already registered")) return "An account with this email already exists.";
  return msg || "Authentication failed.";
};

export const getUserRole = async (userId) => {
  if (!supabaseEnabled || !userId) return "staff";
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? "staff";
};

export const subscribeToAuthChanges = (callback) => {
  if (!supabaseEnabled) {
    callback(null);
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    },
  );
  // Trigger immediately with current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};

export const loginUser = async (email, password) => {
  if (!supabaseEnabled)
    throw new Error("Supabase is not configured. Login is disabled.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error));
  const role = await getUserRole(data.user.id);
  return { user: data.user, role };
};

export const registerUser = async ({ name, email, password, role = "staff" }) => {
  if (!supabaseEnabled)
    throw new Error("Supabase is not configured. Register is disabled.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(mapAuthError(error));
  // Store user profile and role
  await supabase.from("users").upsert({
    id: data.user.id,
    email,
    name,
    role,
  });
  return { user: data.user, role };
};

export const logoutUser = async () => {
  if (!supabaseEnabled) return;
  await supabase.auth.signOut();
};
