import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { listUsers } from "./list-users.ts";
import { signIn, type SignInParams } from "./sign-in.ts";
import { signOut } from "./sign-out.ts";

export const authKeys = {
  users: ["auth", "users"] as const,
};

export const usersQuery = queryOptions({
  queryKey: authKeys.users,
  queryFn: () => listUsers(),
});

export const signInMutation = mutationOptions({
  mutationFn: (params: SignInParams) => signIn({ data: params }),
});

export const signOutMutation = mutationOptions({
  mutationFn: () => signOut(),
});
