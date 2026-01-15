"use server";

import { signIn, signOut } from "@/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function register(data: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const parsed = registerSchema.parse(data);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existing) {
      return { success: false, error: "User already exists" };
    }

    // Hash password
    const hashedPassword = await hash(parsed.password, 10);

    // Create user
    await prisma.user.create({
      data: {
        email: parsed.email,
        password: hashedPassword,
        name: parsed.name,
        isAdmin: false,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

export async function login(credentials: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("Login called with:", credentials);
    const parsed = loginSchema.parse(credentials);
    console.log("Parsed credentials:", parsed);

    const result = await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });

    console.log("SignIn result:", result);
    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("Zod validation errors:", error.errors);
      return { success: false, error: "Invalid input" };
    }
    
    // NextAuth v5 throws errors on failed login
    if (error?.type === "CredentialsSignin") {
      return { success: false, error: "Invalid email or password" };
    }
    
    return {
      success: false,
      error: "Login failed. Please try again.",
    };
  }
}

export async function logout() {
  try {
    await signOut({ redirectTo: "/" });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logout failed",
    };
  }
}
