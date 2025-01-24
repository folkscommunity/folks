"use client";

import { useEffect, useState } from "react";

// this is safe to be in production, don't worry about it.
const vapid_public_key =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BG8XGxqkzgvi5rXU7Xew2hyCylCoUbfssCrvJIGPsb24RlXZ1EqFojRmvYphgjd6SMOt6KdiCtBIX1wznyBrvUE";

export function PushNotificationManager() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <PushNotificationManagerClient /> : <></>;
}

function PushNotificationManagerClient() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );

  function isRunningStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches;
  }

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    if (!subscription) {
      window.addEventListener("click", async () => {
        await subscribeToPush();
      });
    }

    return () => {
      window.removeEventListener("click", async () => {
        await subscribeToPush();
      });
    };
  }, [subscription]);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapid_public_key
      });

      setSubscription(sub);

      await fetch("/api/notifications/register/web", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sub: sub
        })
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);

    const sub = await subscription?.toJSON();

    await fetch("/api/notifications/web", {
      method: "DELETE",
      body: JSON.stringify({ sub: sub }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  return (
    <>
      {isRunningStandalone() && isSupported && !subscription ? (
        <div className="flex w-full items-center justify-center">
          <button onClick={() => subscribeToPush()}>
            Enable Push Notifications
          </button>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
