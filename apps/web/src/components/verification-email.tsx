"use client";

import { useState } from "react";
import Autolinker from "autolinker";

export function VerificationEmailAlert() {
  const [response, setResponse] = useState("");
  const [tryAgain, setTryAgain] = useState(true);

  function resendEmail() {
    fetch("/api/auth/resend-email", {
      method: "POST"
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          setResponse(
            "Email has been sent again, check your email including spam!"
          );
        } else {
          if (res.error === "rate_limit_exceeded_24h") {
            setResponse(res.msg);
            setTryAgain(false);
          } else if (res.error === "rate_limit_exceeded_5m") {
            setResponse(res.msg);
          } else if (res.error === "rate_limit_exceeded_60s") {
            setResponse(res.msg);
          } else if (res.error === "email_already_verified") {
            setResponse("Your email has already been verified.");
            window.location.reload();
          } else {
            setResponse(
              "Something went wrong. Please contact help@folkscommunity.com."
            );
          }
        }
      })
      .catch((err) => {
        alert("Something went wrong.");
      });
  }

  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      {!response ? (
        <p className="m-0">
          Please verify your email before posting. Click{" "}
          <span
            className="hover cursor-pointer underline hover:opacity-80"
            onClick={resendEmail}
          >
            here
          </span>{" "}
          to resend it.
        </p>
      ) : (
        <p className="m-0">
          <span
            dangerouslySetInnerHTML={{
              __html: new Autolinker({
                className: "underline hover:opacity-80"
              }).link(response)
            }}
          />

          {tryAgain && (
            <>
              <span
                className="hover cursor-pointer pl-[1ch] underline hover:opacity-80"
                onClick={resendEmail}
              >
                Click here
              </span>{" "}
              to try again.
            </>
          )}
        </p>
      )}
    </div>
  );
}
