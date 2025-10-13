"use client";

import { UserPresence } from "@/types";

interface CursorProps {
  user: UserPresence;
}

export default function Cursor({ user }: CursorProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 transition-all duration-75 ease-out"
      style={{
        left: `${user.cursor.x}px`,
        top: `${user.cursor.y}px`,
        transform: "translate(-2px, -2px)",
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673L11.6537 5.36729C11.8786 5.09596 12.2929 5.07235 12.5481 5.31928C12.6098 5.37644 12.6575 5.44629 12.6878 5.52385L15.4892 12.5472C15.6192 12.8793 15.4533 13.2506 15.1212 13.3806C15.0341 13.414 14.9397 13.4257 14.8463 13.4138L10.8903 12.9064L9.13036 17.6865C9.00535 18.02 8.63513 18.1896 8.30166 18.0646C8.18591 18.0204 8.08428 17.9466 8.00655 17.8507L5.65376 14.9977C5.41343 14.7085 5.44935 14.2869 5.73862 14.0465C5.82717 13.9706 5.93285 13.9175 6.04683 13.8915L10.0533 12.9585L8.6822 10.7645L5.65376 12.3673Z"
          fill={user.user.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label */}
      <div
        className="ml-6 -mt-2 px-2 py-1 rounded-md text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: user.user.color }}
      >
        {user.user.name}
      </div>
    </div>
  );
}
