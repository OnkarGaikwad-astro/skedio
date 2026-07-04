import Link from "next/link";
import { getSession } from "@/lib/session";
import { ArrowRight, Calendar, Clock, BookOpen, Users, Play, Shield, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight">Skedio</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link 
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                Dashboard
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block px-5 py-2.5 text-sm font-medium hover:text-indigo-400 transition-colors">
                  Log in
                </Link>
                <Link 
                  href="/register"
                  className="group relative inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-sm mb-8 ring-1 ring-indigo-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span>The Next Generation of School Scheduling</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 font-heading animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both leading-[1.1]">
            Intelligent Timetables,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Effortless Management
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300 fill-mode-both">
            Skedio empowers schools to create conflict-free, optimized schedules in minutes. Experience the premium platform designed for modern education administrators.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500 fill-mode-both">
            {session ? (
              <Link 
                href="/dashboard"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
              >
                Enter Workspace
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/register"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
                >
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="#features"
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-full font-semibold text-lg transition-all backdrop-blur-md ring-1 ring-foreground/10"
                >
                  <Play className="w-5 h-5" />
                  See how it works
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-20 max-w-6xl mx-auto relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700 fill-mode-both">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] blur-2xl opacity-20" />
          <div className="relative rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-xl p-2 md:p-4 shadow-2xl">
            <div className="rounded-[16px] overflow-hidden border border-white/5 bg-background shadow-inner">
              {/* Mockup Header */}
              <div className="h-12 border-b border-border/50 flex items-center px-4 gap-2 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
              </div>
              {/* Mockup Content */}
              <div className="p-6 md:p-10 bg-gradient-to-br from-background to-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: "Total Classes", value: "24", icon: BookOpen, color: "text-blue-500 dark:text-blue-400" },
                    { label: "Active Teachers", value: "48", icon: Users, color: "text-purple-500 dark:text-purple-400" },
                    { label: "Weekly Sessions", value: "312", icon: Calendar, color: "text-pink-500 dark:text-pink-400" }
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-background/50 border border-border/50 backdrop-blur-md flex items-center gap-4 shadow-sm">
                      <div className={`p-3 rounded-xl bg-muted/50 ${stat.color} ring-1 ring-border/50`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-background/50 border border-border/50 overflow-hidden shadow-sm">
                  {/* Header Row */}
                  <div className="grid grid-cols-6 border-b border-border/50 bg-muted/20">
                    <div className="p-3 border-r border-border/50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                      <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground tracking-wider uppercase border-r border-border/50 last:border-0">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Grid Rows */}
                  <div className="divide-y divide-border/50">
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="grid grid-cols-6">
                        {/* Time Column */}
                        <div className="p-3 border-r border-border/50 text-xs text-muted-foreground/60 flex flex-col items-center justify-center bg-muted/10 font-medium">
                          <span>0{row + 8}:00</span>
                        </div>
                        {/* Days Columns */}
                        {[1, 2, 3, 4, 5].map((col) => (
                          <div key={col} className="p-2 border-r border-border/50 last:border-0 bg-background/30">
                            {/* Skeleton Card */}
                            {(row === 1 && (col === 1 || col === 3 || col === 5)) || 
                             (row === 2 && (col === 2 || col === 4)) || 
                             (row === 3 && (col === 1 || col === 2 || col === 5)) ? (
                              <div className={`h-full min-h-[56px] rounded-lg border p-2 flex flex-col gap-2 transition-all ${
                                (row + col) % 3 === 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 
                                (row + col) % 2 === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 
                                'bg-purple-500/10 border-purple-500/20'
                              }`}>
                                <div className="h-2 w-3/5 bg-foreground/20 rounded-full" />
                                <div className="h-1.5 w-4/5 bg-foreground/10 rounded-full" />
                              </div>
                            ) : (
                              <div className="h-full min-h-[56px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative z-10 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-heading mb-6">Designed for Excellence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your school's schedule, beautifully packaged in an intuitive interface.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Scheduling",
                description: "Automatically detect conflicts and optimize teacher workload with our intelligent scheduling engine.",
                icon: Calendar,
                color: "from-blue-500/20 to-cyan-500/20 text-blue-500 dark:text-cyan-400 border-blue-500/20"
              },
              {
                title: "Real-time Updates",
                description: "Changes reflect instantly across the entire system. No more manual synchronization or printing delays.",
                icon: Clock,
                color: "from-purple-500/20 to-pink-500/20 text-purple-500 dark:text-pink-400 border-purple-500/20"
              },
              {
                title: "Secure & Reliable",
                description: "Enterprise-grade security ensures your school's data is protected with state-of-the-art encryption.",
                icon: Shield,
                color: "from-emerald-500/20 to-teal-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-background border border-border/50 hover:border-foreground/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 ring-1 transition-transform group-hover:scale-110`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-16 text-center text-muted-foreground relative overflow-hidden">
        {/* Subtle background glow for footer */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="flex flex-col items-center justify-center gap-6 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="font-heading font-bold text-foreground text-2xl tracking-tight">Skedio</span>
          </div>
          
          <div className="group mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-b from-foreground/[0.03] to-transparent border border-border/50 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-foreground/[0.05] hover:border-border hover:shadow-md cursor-default">
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground/80">
              Designed & Developed with
            </span>
            <span className="text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] text-lg">❤️</span>
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground/80">
              by <strong className="text-foreground font-semibold tracking-wide ml-0.5">Onkar Gaikwad</strong>
            </span>
          </div>

          <p className="text-sm opacity-80">© {new Date().getFullYear()} Skedio Platforms. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
