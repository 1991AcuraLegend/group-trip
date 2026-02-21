import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-sand-50 via-ocean-50 to-sand-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="animate-fade-in-up max-w-2xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 bg-ocean-100 text-ocean-700 px-4 py-1.5 rounded-full text-sm font-medium">
            Trip planning made easy
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-ocean-900 mb-6 leading-tight">
            Plan your next<br />
            <span className="text-coral-500">adventure</span>, together
          </h1>
          <p className="text-sand-600 text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed">
            Organize flights, lodging, restaurants, and activities — all in one beautiful place. Invite friends and plan collaboratively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-ocean-600 hover:bg-ocean-700 text-white font-medium rounded-lg transition-all duration-200 active:scale-[0.98] text-base"
            >
              Get Started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-sand-100 hover:bg-sand-200 text-sand-800 border border-sand-300 font-medium rounded-lg transition-all duration-200 active:scale-[0.98] text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative -mt-16">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </div>

      {/* Features */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-ocean-900 text-center mb-4">
            Everything you need for the perfect trip
          </h2>
          <p className="text-sand-500 text-center mb-12 max-w-xl mx-auto">
            From the first flight to the last restaurant reservation — keep it all together.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass text-center p-6 rounded-xl border border-sand-200 bg-sand-50 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-ocean-100 text-ocean-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-xl mb-2">Interactive Maps</h3>
              <p className="text-sand-500 text-sm leading-relaxed">Visualize your itinerary on a map. See flights, hotels, restaurants, and activities all at once.</p>
            </div>
            <div className="glass text-center p-6 rounded-xl border border-sand-200 bg-sand-50 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-seafoam-50 text-seafoam-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-xl mb-2">Collaborative Planning</h3>
              <p className="text-sand-500 text-sm leading-relaxed">Invite travel companions to view and edit the trip together. Everyone stays on the same page.</p>
            </div>
            <div className="glass text-center p-6 rounded-xl border border-sand-200 bg-sand-50 hover:shadow-md transition-all duration-200">
              <div className="w-12 h-12 bg-coral-50 text-coral-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-xl mb-2">All in One Place</h3>
              <p className="text-sand-500 text-sm leading-relaxed">Flights, lodging, car rentals, restaurants, activities — organized and easy to find.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-sand-200 py-8 px-6 text-center">
        <p className="text-sand-400 text-sm">&copy; 2026 TravelPlanner. Made for adventurers.</p>
      </footer>
    </main>
  );
}
