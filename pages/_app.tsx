import type { AppProps } from "next/app";

import {
    ClerkProvider,
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs'
  import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ClerkProvider>
            <div className="absolute top-4 right-8">
                <SignedOut>
                    <SignInButton />
                </SignedOut>

                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
            <Component {...pageProps} />
        </ClerkProvider>
    )
  }