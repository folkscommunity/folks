"use client";

import React, { useEffect } from "react";
import SocketIO, { type Socket } from "socket.io-client";

export const socket = SocketIO({
  withCredentials: true,
  path: "/ws",
  retries: Infinity,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 5000,
  autoConnect: false,
  transports: ["websocket"],
  // upgrade: true,
  addTrailingSlash: false
});

export const SocketContext = React.createContext<any>(undefined);

export function SocketProvider({ children }: { children: any }) {
  const [connected, setConnected] = React.useState(false);

  useEffect(() => {
    if (socket) {
      if (!socket.connected) {
        socket.connect();
      }

      socket.on("connect", () => {
        setConnected(true);
      });

      socket.on("disconnect", () => {
        setConnected(false);
      });

      socket.on("error", (err) => {
        // console.log("error", err);
      });

      // socket.on("message", (data) => {
      //   console.log("message", data);
      // });

      socket.on("force_refresh_page", (data) => {
        try {
          window.location.reload();
        } catch (e) {}
      });
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socket, isConnected: connected }}>
      <div className="fixed bottom-2 left-2">
        {connected ? (
          <div className="size-2 rounded-full bg-green-500 opacity-0" />
        ) : (
          <div className="size-2 rounded-full bg-red-500 opacity-20" />
        )}
      </div>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): { socket: Socket; isConnected: boolean } {
  const context = React.useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a <SocketProvider />");
  }

  return context;
}
