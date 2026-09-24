import { Link } from "wouter";
import { AppLink } from "@/components/app-link";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Privacy() {
  return (
    <main className="lumora-shell min-h-[100dvh]">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10">
        <Reveal>
          <p className="eyebrow text-emphasis">Privacy</p>
          <h1 className="display mt-4 text-[clamp(3rem,6vw,5.5rem)] leading-[.86] text-heading">
            What Lumora keeps, and what it does not.
          </h1>
          <div className="mt-10 space-y-8 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
            <p>
              Lumora is an account-based password manager. You create a username and password, then store
              encrypted logins in your vault. This page describes that product — not a local-only demo.
            </p>
            <section>
              <h2 className="text-base font-semibold text-heading">Your account</h2>
              <p className="mt-2">
                We store the account you create (username, password hash, profile details you choose) so you
                can sign in on this device or another. We do not sell that data.
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-heading">Your vault</h2>
              <p className="mt-2">
                Login records are encrypted on your device with AES-GCM before they are saved to your
                account. The vault key is derived on the device. Changing your account password re-wraps
                that key; it does not require re-encrypting every record.
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-heading">Recovery key</h2>
              <p className="mt-2">
                When you create an account, Lumora gives you a recovery key. Store it offline. It is the
                way back in if you forget your password. Lumora cannot recreate a key you lost.{" "}
                <AppLink
                  path="/forgot-password"
                  className="story-link font-medium text-heading"
                  testId="link-privacy-forgot-password"
                >
                  Recover access
                </AppLink>
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-heading">Biometrics</h2>
              <p className="mt-2">
                Fingerprint or device biometrics stay on your device. They are an unlock convenience for
                a signed-in account, not a replacement for your password or recovery key.
              </p>
            </section>
          </div>
          <Link href="/" className="story-link mt-12 inline-block text-sm font-medium text-heading" data-testid="link-privacy-home">
            Back to Lumora
          </Link>
        </Reveal>
      </article>
      <SiteFooter />
    </main>
  );
}
