/* eslint-disable react/react-in-jsx-scope */
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Root context providers for the application.
 *
 * Currently this wraps the app in a SessionProvider so that client components
 * can access the authentication session via useSession().  Additional
 * providers (e.g. theme, global state) can be added here when needed.
 */
interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
<<<<<<< HEAD
}
=======
}
>>>>>>> 046ecbe6ce62922c21012150d250ea1a01b13417
