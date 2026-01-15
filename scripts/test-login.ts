import { signIn } from "@/auth";

async function testLogin() {
  try {
    console.log("Testing login with admin@veer...");
    
    const result = await signIn("credentials", {
      email: "admin@veer",
      password: "admin@veer",
      redirect: false,
    });
    
    console.log("Login result:", result);
  } catch (error: any) {
    console.log("Login error:", error);
    console.log("Error type:", error?.type);
    console.log("Error message:", error?.message);
  }
}

testLogin();
