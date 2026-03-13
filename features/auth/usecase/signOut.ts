"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import usecase from "@/lib/usecase";

const signOut = usecase(async (_args) => {
  await auth.api.signOut({
    headers: await headers(),
  });
});

export default signOut;
