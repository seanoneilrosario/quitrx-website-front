"use client";

import { io } from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_REALTIME_URL || "https://retail-api.quithero.com.au/realtime",
  {
    withCredentials: true,
    // Client components also render on the server. Connect only after mounting.
    autoConnect: false,
  },
);
