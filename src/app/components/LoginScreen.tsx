import { useState } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import type { SignupData } from "../services/authService";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (data: SignupData) => Promise<void>;
}

export function LoginScreen({ onLogin, onSignup }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ NEW (create-account extra fields)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [region, setRegion] = useState("");

  const [showPassword, setShowPassword] = useState(false); // hidden by default
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login mode
        await onLogin(email, password);
      } else {
        // Signup mode - pass all fields
        await onSignup({
          email,
          password,
          fullName,
          phone,
          designation,
          region,
        });
        // Show success message and switch to login
        setSignupSuccess(true);
        setIsLogin(true);
        // Clear form fields
        setPassword("");
        setFullName("");
        setPhone("");
        setDesignation("");
        setRegion("");
        // Keep email so user can easily login
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white p-4 flex items-center justify-center">
      {/* ✅ Keep the "mobile card" feel even on desktop */}
      <Card className="w-full max-w-sm sm:max-w-md p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-3">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>

          <h1 className="text-center mb-1">Nodus</h1>
          <p className="text-muted-foreground text-center m-0 font-semibold">
            Emergency Response System
          </p>
        </div>

        {/* Login title */}
        <p className="text-center text-primary font-semibold text-lg mb-0">
          {isLogin ? "Login" : "Create Account"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Success message after signup */}
          {signupSuccess && (
            <div className="p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              <p className="font-semibold m-0 text-base">Account created successfully!</p>
              <p className="m-0 mt-2">Your account is now pending approval by an administrator. You will be able to login once approved.</p>
              <button
                type="button"
                onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
                className="mt-3 text-primary hover:underline font-medium"
              >
                Back to Login
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* ✅ Create Account extra fields (ORDER AS REQUESTED) */}
          {!isLogin && (
            <>
              {/* 1. Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="
                    bg-input-background
                    border border-primary
                    rounded-lg
                    focus-visible:ring-2
                    focus-visible:ring-primary/30
                  "
                />
              </div>
            </>
          )}

          {/* 2. Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="
                bg-input-background
                border border-primary
                rounded-lg
                focus-visible:ring-2
                focus-visible:ring-primary/30
              "
            />
          </div>

          {/* ✅ Password should be after email */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="
                  bg-input-background
                  border border-primary
                  rounded-lg
                  pr-10
                  focus-visible:ring-2
                  focus-visible:ring-primary/30
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-primary
                  hover:opacity-80
                "
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* ✅ Create Account extra fields continue */}
          {!isLogin && (
            <>
              {/* 3. Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={isLoading}
                  className="
                    bg-input-background
                    border border-primary
                    rounded-lg
                    focus-visible:ring-2
                    focus-visible:ring-primary/30
                  "
                />
              </div>

              {/* 5. Designation */}
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                  disabled={isLoading}
                  className="
                    bg-input-background
                    border border-primary
                    rounded-lg
                    focus-visible:ring-2
                    focus-visible:ring-primary/30
                  "
                />
              </div>

              {/* 6. Region */}
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  disabled={isLoading}
                  className="
                    bg-input-background
                    border border-primary
                    rounded-lg
                    focus-visible:ring-2
                    focus-visible:ring-primary/30
                  "
                />
              </div>
            </>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "Need an account? Sign up"
                : "Already have an account? Login"}
            </button>

            <p className="text-sm text-muted-foreground m-0">
              Once logged in, you can continue using the app offline
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
