import { useState } from "react";
import { Shield, Eye, EyeOff } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // hidden by default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-sm">
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
          Login
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                bg-input-background
                border border-primary
                rounded-lg
                focus-visible:ring-2
                focus-visible:ring-primary/30
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          {/* Submit */}
          <Button type="submit" className="w-full">
            Login
          </Button>

          <p className="text-sm text-muted-foreground text-center m-0 pt-2">
            Once logged in, you can continue using the app offline
          </p>
        </form>
      </Card>
    </div>
  );
}
