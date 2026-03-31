"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MailX, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "confirm" | "success" | "error" | "already">("loading");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid or missing unsubscribe link.");
      return;
    }

    // Verify the token
    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setError(data.error);
        } else if (data.alreadyUnsubscribed) {
          setStatus("already");
          setEmail(data.email);
        } else {
          setStatus("confirm");
          setEmail(data.email);
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Failed to verify unsubscribe link.");
      });
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.error) {
        setStatus("error");
        setError(data.error);
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setError("Failed to process unsubscribe request.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4">
      <Card className="w-full max-w-md bg-[#0d1220] border-[#1e2a40]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="w-12 h-12 text-[#7c3aed] animate-spin" />}
            {status === "confirm" && <MailX className="w-12 h-12 text-yellow-500" />}
            {status === "success" && <CheckCircle className="w-12 h-12 text-green-500" />}
            {status === "error" && <XCircle className="w-12 h-12 text-red-500" />}
            {status === "already" && <Mail className="w-12 h-12 text-gray-500" />}
          </div>
          <CardTitle className="text-white">
            {status === "loading" && "Verifying..."}
            {status === "confirm" && "Unsubscribe from Emails"}
            {status === "success" && "Successfully Unsubscribed"}
            {status === "error" && "Oops!"}
            {status === "already" && "Already Unsubscribed"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {status === "loading" && "Please wait while we verify your request..."}
            {status === "confirm" && `Confirm unsubscribe for: ${email}`}
            {status === "success" && "You will no longer receive marketing emails from Fluenzy AI."}
            {status === "error" && error}
            {status === "already" && `${email} is already unsubscribed.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "confirm" && (
            <>
              <p className="text-sm text-gray-400 text-center">
                Click the button below to stop receiving promotional emails. You'll still receive important account-related emails.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Unsubscribe"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full border-[#1e2a40] text-gray-300 hover:bg-[#1e2a40]"
              >
                Cancel
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <p className="text-sm text-gray-400 text-center">
                Changed your mind? You can update your preferences anytime from your account settings.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9]"
              >
                Go to Homepage
              </Button>
            </>
          )}

          {status === "error" && (
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9]"
            >
              Go to Homepage
            </Button>
          )}

          {status === "already" && (
            <>
              <p className="text-sm text-gray-400 text-center">
                This email address is already unsubscribed from our marketing emails.
              </p>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-[#7c3aed] hover:bg-[#6d28d9]"
              >
                Go to Homepage
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
