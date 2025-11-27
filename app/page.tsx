import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/server/auth";
import LogoutButtons from "@/components/auth/logoutButtons";
import { SendEmailButton } from "@/components/email/send-email-button";

const Home = async () => {

  const session = await auth.api.getSession({
    headers: await (await headers())
  });


  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <div>
          <h1 className="font-bold text-4xl mb-3">Template for Next js</h1>
          <p>Consist of</p>
          <ol className="list-inside list-decimal">
            <li>Basic Next.js + Tailwind CSS boilerplate</li>
            <li>Shadcn/ui</li>
            <li>Better-Auth with Google OAuth</li>
            <li>Basic login flow using Better-Auth</li>
            <li>Connection template to a postgresql database for development, testing and production</li>
          </ol>
        </div>
        {session?.user ? (
          <div>
            <h1>Welcome {session.user.name}</h1>
            <LogoutButtons />
          </div>
        ) : (
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
        {session?.user?.email === 'xavier.khew.dev@gmail.com' || session?.user?.email === 'xavier.khew.work@gmail.com' && (
          <div className="border-t pt-8 mt-8">
            <h2 className="font-semibold text-xl mb-4">Test Email Functionality</h2>
            <SendEmailButton />
          </div>
        )}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <Link href={"/changelog"}>Changelog</Link>
        <Link href={"/changelog-template"}>Template Changelog</Link>
      </footer>
    </div>
  );
}

export default Home;
