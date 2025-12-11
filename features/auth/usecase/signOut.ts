"use server";

import usecase from "@/lib/usecase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const signOut = usecase(async (_args: {}) => {
  await auth.api.signOut({
    headers: await headers(),
  });
});

export default signOut;

