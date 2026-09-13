import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  UserX,
  Coffee,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/** Normalize to E.164-ish: keep digits, ensure +91 prefix for 10-digit Indian numbers. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 8) return `+${digits}`;
  if (digits.length >= 8) return `+${digits}`;
  return null;
}

type Mode = "phone" | "email";

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  const [mode, setMode] = useState<Mode>("phone");
  const [step, setStep] = useState<"entry" | { identifier: string; via: Mode }>("entry");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigate once authenticated — regardless of which provider completed the sign-in.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const sendCode = async (identifier: string, via: Mode) => {
    setIsLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set(via === "phone" ? "phone" : "email", identifier);
      await signIn(via === "phone" ? "phone-otp" : "email-otp", fd);
      setStep({ identifier, via });
      setOtp("");
    } catch (e) {
      console.error("Send code error:", e);
      setError(
        via === "phone"
          ? "Couldn't send the code to that number. Check it and try again."
          : "Failed to send the verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const raw = String(new FormData(event.currentTarget).get("phone") ?? "");
    const normalized = normalizePhone(raw);
    if (!normalized) {
      setError("Enter a valid mobile number (10 digits).");
      return;
    }
    void sendCode(normalized, "phone");
  };

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    void sendCode(email, "email");
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof step !== "object") return;
    setIsLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set(step.via === "phone" ? "phone" : "email", step.identifier);
      fd.set("code", otp);
      await signIn(step.via === "phone" ? "phone-otp" : "email-otp", fd);
      // On success useAuth flips isAuthenticated and the effect above navigates.
    } catch (e) {
      console.error("OTP verification error:", e);
      setError("The verification code you entered is incorrect or has expired.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch (e) {
      console.error("Guest login error:", e);
      setError(
        `Failed to sign in as guest: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  const identifier = typeof step === "object" ? step.identifier : "";
  const via = typeof step === "object" ? step.via : "phone";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-cafe-gradient relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(196,106,43,0.2),transparent_60%)]" />
        <div className="relative text-center px-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/20 text-gold mx-auto mb-6">
            <Coffee className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">The Belgravia Roast</h2>
          <p className="text-white/50 leading-relaxed max-w-sm">
            Where every cup tells a story and every visit feels like coming home.
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-white">
              <Coffee className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">
              The Belgravia <span className="text-gold">Roast</span>
            </span>
          </div>

          <Card className="glass-elevated liquid-sheen-slow border-0 shadow-md">
            {step === "entry" ? (
              <>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in with your mobile number — we'll text you a code
                  </CardDescription>
                </CardHeader>
                {mode === "phone" ? (
                  <form onSubmit={handlePhoneSubmit}>
                    <CardContent>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="phone"
                            placeholder="+91 98765 43210"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            className="pl-9"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-500">{error}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col gap-3">
                      <Button
                        type="submit"
                        className="w-full bg-gold hover:bg-gold/90"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending code...
                          </>
                        ) : (
                          <>
                            Send verification code
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <div className="relative w-full mt-1">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setMode("email");
                            setError(null);
                          }}
                          disabled={isLoading}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGuestLogin}
                          disabled={isLoading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Guest
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                ) : (
                  <form onSubmit={handleEmailSubmit}>
                    <CardContent>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            className="pl-9"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          size="icon"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {error && (
                        <p className="mt-2 text-sm text-red-500">{error}</p>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col gap-3">
                      <Button
                        type="submit"
                        className="w-full bg-gold hover:bg-gold/90"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending code...
                          </>
                        ) : (
                          <>
                            Send verification code
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setMode("phone");
                            setError(null);
                          }}
                          disabled={isLoading}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Phone
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGuestLogin}
                          disabled={isLoading}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Guest
                        </Button>
                      </div>
                    </CardFooter>
                  </form>
                )}
              </>
            ) : (
              <>
                <CardHeader className="text-center">
                  <CardTitle>Check your {via === "phone" ? "messages" : "email"}</CardTitle>
                  <CardDescription>
                    We've sent a 6-digit code to {identifier}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pb-4">
                    <input
                      type="hidden"
                      name={via === "phone" ? "phone" : "email"}
                      value={identifier}
                    />
                    <input type="hidden" name="code" value={otp} />
                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
                    )}
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => void sendCode(identifier, via)}
                      >
                        Resend
                      </Button>
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <Button
                      type="submit"
                      className="w-full bg-gold hover:bg-gold/90"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Verify code
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep("entry");
                        setOtp("");
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Use a different {via === "phone" ? "number" : "email"}
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
