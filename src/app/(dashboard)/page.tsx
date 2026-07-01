import { Users, BookOpen, Presentation, Clock, CalendarDays, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.schoolId) {
    redirect("/login");
  }

  // Get counts for the school
  const [{ count: teachersCount }, { count: classesCount }, { count: subjectsCount }] = await Promise.all([
    supabase.from("Teacher").select("*", { count: "exact", head: true }).eq("schoolId", session.schoolId),
    supabase.from("Class").select("*", { count: "exact", head: true }).eq("schoolId", session.schoolId),
    supabase.from("Subject").select("*", { count: "exact", head: true }).eq("schoolId", session.schoolId),
  ]);

  const stats = [
    {
      name: "Total Teachers",
      value: (teachersCount || 0).toString(),
      icon: Users,
      trend: "+2 this month",
      color: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-500/30",
      ring: "ring-blue-500/40",
      glow: "bg-blue-500/30",
      cardBg: "bg-blue-500/15 dark:bg-blue-900/30",
      cardBorder: "border-blue-400/60 dark:border-blue-700/60 hover:border-blue-500 dark:hover:border-blue-500",
      cardShadow: "hover:shadow-[0_8px_30px_rgb(59,130,246,0.25)]",
    },
    {
      name: "Total Classes",
      value: (classesCount || 0).toString(),
      icon: Presentation,
      trend: "No changes",
      color: "text-violet-700 dark:text-violet-300",
      bg: "bg-violet-500/30",
      ring: "ring-violet-500/40",
      glow: "bg-violet-500/30",
      cardBg: "bg-violet-500/15 dark:bg-violet-900/30",
      cardBorder: "border-violet-400/60 dark:border-violet-700/60 hover:border-violet-500 dark:hover:border-violet-500",
      cardShadow: "hover:shadow-[0_8px_30px_rgb(139,92,246,0.25)]",
    },
    {
      name: "Total Subjects",
      value: (subjectsCount || 0).toString(),
      icon: BookOpen,
      trend: "+1 this month",
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-500/30",
      ring: "ring-emerald-500/40",
      glow: "bg-emerald-500/30",
      cardBg: "bg-emerald-500/15 dark:bg-emerald-900/30",
      cardBorder: "border-emerald-400/60 dark:border-emerald-700/60 hover:border-emerald-500 dark:hover:border-emerald-500",
      cardShadow: "hover:shadow-[0_8px_30px_rgb(16,185,129,0.25)]",
    },
    {
      name: "Active Periods",
      value: "35",
      icon: Clock,
      trend: "Currently running",
      color: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-500/30",
      ring: "ring-amber-500/40",
      glow: "bg-amber-500/30",
      cardBg: "bg-amber-500/15 dark:bg-amber-900/30",
      cardBorder: "border-amber-400/60 dark:border-amber-700/60 hover:border-amber-500 dark:hover:border-amber-500",
      cardShadow: "hover:shadow-[0_8px_30px_rgb(245,158,11,0.25)]",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {session.name}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your school's scheduling data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className={`group relative overflow-hidden rounded-[24px] border backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 ${stat.cardBg} ${stat.cardBorder} ${stat.cardShadow} p-6`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full transition-transform duration-700 group-hover:scale-[2] ${stat.glow} blur-2xl`} />
              
              <div className="relative flex flex-col gap-4 z-10">
                <div className="flex items-center justify-between">
                  <div className={`rounded-2xl p-3 ring-1 ${stat.color} ${stat.bg} ${stat.ring} shadow-inner backdrop-blur-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center text-xs font-medium text-muted-foreground bg-background/60 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-border/50">
                    {stat.trend}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[24px] border border-blue-400/60 dark:border-blue-700/60 bg-blue-500/15 dark:bg-blue-900/30 p-6 shadow-sm backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500 hover:shadow-[0_8px_30px_rgb(59,130,246,0.25)]">
          <div className="absolute right-0 bottom-0 -mr-16 -mb-16 h-48 w-48 rounded-full transition-transform duration-700 group-hover:scale-[1.5] bg-blue-500/20 blur-3xl z-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-blue-500/30 p-2 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/40 shadow-inner backdrop-blur-md">
                <CalendarDays className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
            </div>
            <div className="flex h-[200px] items-center justify-center rounded-xl border border-blue-400/30 dark:border-blue-700/40 bg-blue-500/10 backdrop-blur-md shadow-inner">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">No recent activity to show.</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-[24px] border border-emerald-400/60 dark:border-emerald-700/60 bg-emerald-500/15 dark:bg-emerald-900/30 p-6 shadow-sm backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-500 hover:shadow-[0_8px_30px_rgb(16,185,129,0.25)]">
          <div className="absolute right-0 bottom-0 -mr-16 -mb-16 h-48 w-48 rounded-full transition-transform duration-700 group-hover:scale-[1.5] bg-emerald-500/20 blur-3xl z-0" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-emerald-500/30 p-2 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/40 shadow-inner backdrop-blur-md">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-foreground">Scheduling Efficiency</h3>
            </div>
            <div className="flex h-[200px] items-center justify-center rounded-xl border border-emerald-400/30 dark:border-emerald-700/40 bg-emerald-500/10 backdrop-blur-md shadow-inner">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Generate a timetable to see analytics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
