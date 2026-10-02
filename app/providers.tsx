"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#059669", // emerald-600 to match the app theme
          logo: "/logo 3wm jjj-01.png",
        },
        // Allow login via phone, email, and wallet
        loginMethods: ["sms", "email", "wallet"],
        // C'EST CETTE PARTIE QUI EST CRUCIALE :
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          }
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
