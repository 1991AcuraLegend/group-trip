import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-sand-50 via-ocean-50 to-sand-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="animate-fade-in-up max-w-3xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 bg-ocean-100 text-ocean-700 px-4 py-1.5 rounded-full text-sm font-medium">
            ✈️ Trip planning reimagined
          </div>
          <h1 className="font-display text-5xl md:text-7xl text-ocean-900 mb-6 leading-tight">
            Plan your next<br />
            <span className="text-coral-500">adventure</span>, together
          </h1>
          <p className="text-sand-600 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            From brainstorming ideas to booking confirmations, organize every detail of your trip in one beautiful place. 
            Track flights, hotels, restaurants, and activities with interactive maps and timelines. 
            Invite friends to collaborate and keep everyone on the same page.
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

      {/* Feature 1: Trip Detail & Map */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-ocean-100 text-ocean-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Interactive Maps
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ocean-900 mb-4">
                See your trip on the map
              </h2>
              <p className="text-sand-600 text-lg mb-6 leading-relaxed">
                Visualize your entire itinerary with an interactive map. Every hotel, restaurant, and activity shows up with custom markers, so you can see how everything connects. Perfect for planning your daily routes and discovering what&apos;s nearby.
              </p>
              <ul className="space-y-3 text-sand-600">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Color-coded markers for each entry type</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Click markers to view full details</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Automatic geocoding for addresses</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-xl overflow-hidden shadow-xl border border-sand-200">
                <Image
                  src="/trip_detail.png"
                  alt="Trip detail page showing map and entry list"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Ideas Board */}
      <section className="bg-gradient-to-br from-sand-50 to-ocean-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="rounded-xl overflow-hidden shadow-xl border border-sand-200">
                <Image
                  src="/ideas_board.png"
                  alt="Ideas board with multiple columns for different entry types"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-seafoam-100 text-seafoam-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Brainstorming Mode
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ocean-900 mb-4">
                Capture ideas, plan later
              </h2>
              <p className="text-sand-600 text-lg mb-6 leading-relaxed">
                Not ready to commit to dates yet? Use the Ideas board to collect possibilities. Save restaurants you want to try, activities you&apos;re considering, and hotels you&apos;re researching. When you&apos;re ready, move them to your confirmed plans with just a click.
              </p>
              <ul className="space-y-3 text-sand-600">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-seafoam-100 text-seafoam-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Separate lanes for flights, hotels, dining, transport, and activities</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-seafoam-100 text-seafoam-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>No dates required—perfect for early planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-seafoam-100 text-seafoam-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Move ideas to confirmed plans when ready</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Timeline */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-coral-100 text-coral-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Visual Timeline
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ocean-900 mb-4">
                Stay on schedule, stress-free
              </h2>
              <p className="text-sand-600 text-lg mb-6 leading-relaxed">
                See your entire trip laid out hour by hour. The timeline view shows overlapping activities, helps you spot scheduling conflicts, and makes it easy to see what&apos;s happening when. No more juggling screenshots and spreadsheets.
              </p>
              <ul className="space-y-3 text-sand-600">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-coral-100 text-coral-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Day-by-day breakdown with hourly precision</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-coral-100 text-coral-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Smart overlap detection for activities</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-coral-100 text-coral-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Color-coded entries with full details</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-xl overflow-hidden shadow-xl border border-sand-200">
                <Image
                  src="/timeline.png"
                  alt="Timeline view showing day-by-day schedule"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Cost Breakdown */}
      <section className="bg-gradient-to-br from-sand-50 to-ocean-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="rounded-xl overflow-hidden shadow-xl border border-sand-200">
                <Image
                  src="/cost_breakdown.png"
                  alt="Cost breakdown showing budget by category"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-ocean-100 text-ocean-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
                Budget Tracking
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ocean-900 mb-4">
                Know what you&apos;re spending
              </h2>
              <p className="text-sand-600 text-lg mb-6 leading-relaxed">
                Track costs for every part of your trip. See how much you&apos;re spending on flights, accommodations, food, and activities at a glance. The cost breakdown helps you stay on budget and make informed decisions.
              </p>
              <ul className="space-y-3 text-sand-600">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Automatic totals by category</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Visual breakdown of where your money goes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-ocean-100 text-ocean-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span>Track costs for ideas and confirmed plans separately</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration CTA */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-seafoam-100 text-seafoam-700 px-3 py-1 rounded-full text-xs font-medium mb-4">
            Better Together
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-ocean-900 mb-4">
            Plan trips with your crew
          </h2>
          <p className="text-sand-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Share your trip with friends and family. Give them full editing access to collaborate on plans, or send a view-only link so everyone knows the itinerary. No more group chat chaos—everyone sees the latest updates in real-time.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-xl border border-sand-200 bg-sand-50">
              <div className="w-12 h-12 bg-ocean-100 text-ocean-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-lg mb-2">Owner</h3>
              <p className="text-sand-500 text-sm">Full control over the trip and all entries</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-sand-200 bg-sand-50">
              <div className="w-12 h-12 bg-seafoam-100 text-seafoam-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-lg mb-2">Collaborator</h3>
              <p className="text-sand-500 text-sm">Can add, edit, and delete entries</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-sand-200 bg-sand-50">
              <div className="w-12 h-12 bg-coral-100 text-coral-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="font-display text-ocean-900 text-lg mb-2">Viewer</h3>
              <p className="text-sand-500 text-sm">Read-only access to view all details</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-ocean-500 to-ocean-600 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
            Ready to plan your next adventure?
          </h2>
          <p className="text-ocean-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join travelers who are planning smarter, not harder. Free forever for personal use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-ocean-600 font-medium rounded-lg transition-all duration-200 active:scale-[0.98] hover:shadow-lg text-base"
            >
              Create Your First Trip
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-ocean-700 hover:bg-ocean-800 text-white border border-ocean-400 font-medium rounded-lg transition-all duration-200 active:scale-[0.98] text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ocean-900 py-8 px-6 text-center">
        <p className="text-ocean-300 text-sm">&copy; 2026 TravelPlanner. Made for adventurers. ✈️🗺️</p>
      </footer>
    </main>
  );
}
