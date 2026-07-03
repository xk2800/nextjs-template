"use client";

import { Button } from "../ui/button";
import { useState } from "react";

export function SendEmailButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSendEmail = async (template: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template }),
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
      <div className="flex gap-2">
        <Button onClick={() => handleSendEmail("1")} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Template 1"}
        </Button>
        <Button onClick={() => handleSendEmail("2")} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send Template 2"}
        </Button>
        <Button onClick={() => handleSendEmail("welcome")} disabled={isLoading}>
          {isLoading ? "Sending..." : "Welcome Email"}
        </Button>
      </div>
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
