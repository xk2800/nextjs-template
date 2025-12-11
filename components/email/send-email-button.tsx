"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SendEmailButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendEmail = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send email");
      }

      setMessage("Email sent successfully!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleSendEmail} disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Test Email"}
      </Button>
      {message && (
        <p
          className={`text-sm ${
            message.includes("success") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
