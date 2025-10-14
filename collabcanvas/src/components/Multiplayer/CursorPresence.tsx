"use client";

import { memo } from "react";
import { UserPresence } from "@/types";
import Cursor from "./Cursor";

interface CursorPresenceProps {
  onlineUsers: Map<string, UserPresence>;
}

function CursorPresence({ onlineUsers }: CursorPresenceProps) {
  return (
    <>
      {Array.from(onlineUsers.values()).map((user) => (
        <Cursor key={user.userId} user={user} />
      ))}
    </>
  );
}

export default memo(CursorPresence);
