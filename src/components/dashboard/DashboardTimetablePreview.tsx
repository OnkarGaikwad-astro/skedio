"use client";

import { useState, useMemo, useEffect } from "react";
import { Clock, CalendarDays, GraduationCap, MapPin, Users } from "lucide-react";
import { Break } from "@/app/actions/break";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function minsToTime(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function checkBreakOverlap(periodStr: string, customBreaks: Break[]) {
  const [periodStart, periodEnd] = periodStr.split(" - ");
  const pStartMins = timeToMinutes(periodStart);
  const pEndMins = timeToMinutes(periodEnd);

  for (const b of customBreaks) {
    const bStartMins = timeToMinutes(b.startTime);
    const bEndMins = timeToMinutes(b.endTime);

    if ((pStartMins >= bStartMins && pStartMins < bEndMins) || (bStartMins >= pStartMins && bStartMins < pEndMins)) {
      return b;
    }
  }
  return null;
}

function generatePeriods(startTime: string, endTime: string, slotLengthMins: number, customBreaks: Break[]) {
  const periods = [];
  let currentMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  
  const breaks = [...customBreaks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  while (currentMins + slotLengthMins <= endMins) {
    let handledByBreak = false;
    for (const b of breaks) {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      
      if (currentMins >= bStart && currentMins < bEnd) {
        periods.push(`${minsToTime(bStart)} - ${minsToTime(bEnd)}`);
        currentMins = bEnd;
        handledByBreak = true;
        break;
      }
      
      if (currentMins < bStart && currentMins + slotLengthMins > bStart) {
        const actualEnd = bStart;
        periods.push(`${minsToTime(currentMins)} - ${minsToTime(actualEnd)}`);
        currentMins = actualEnd;
        handledByBreak = true;
        break;
      }
    }
    
    if (handledByBreak) continue;
    
    const startStr = minsToTime(currentMins);
    currentMins += slotLengthMins;
    const endStr = minsToTime(currentMins);
    
    periods.push(`${startStr} - ${endStr}`);
  }
  
  for (const b of breaks) {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    if (currentMins === bStart && bEnd <= endMins) {
      periods.push(`${minsToTime(bStart)} - ${minsToTime(bEnd)}`);
      currentMins = bEnd;
    }
  }

  return periods;
}

export function DashboardTimetablePreview({ 
  teachers, 
  classes,
  timetableData, 
  customBreaks 
}: { 
  teachers: any[], 
  classes: any[],
  timetableData: any,
  customBreaks: Break[]
}) {
  const [currentDay, setCurrentDay] = useState<string>(DAYS[0]);

  useEffect(() => {
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    if (todayIndex >= 1 && todayIndex <= 5) {
      setCurrentDay(DAYS[todayIndex - 1]);
    } else {
      setCurrentDay(DAYS[0]); // Default to Monday on weekends
    }
  }, []);

  const hasTimetable = timetableData && Object.keys(timetableData?.scheduleData || {}).length > 0;

  const dynamicPeriods = useMemo(() => {
    if (!hasTimetable) return [];
    return generatePeriods(
      timetableData.settings.startTime, 
      timetableData.settings.endTime, 
      parseInt(timetableData.settings.slotDuration), 
      customBreaks
    );
  }, [timetableData, customBreaks, hasTimetable]);

  const getTeacherSlot = (teacherId: string, day: string, timeIndex: number) => {
    for (const c of classes) {
      const slot = timetableData.scheduleData[`${c.id}-${day}-${timeIndex}`];
      if (slot && slot.type === "CLASS" && slot.teacher?.id === teacherId) {
        return { ...slot, classInfo: c };
      }
    }
    return null;
  };

  if (!hasTimetable) {
    return (
      <div className="group relative overflow-hidden rounded-[24px] border border-blue-400/60 dark:border-blue-700/60 bg-blue-500/5 dark:bg-blue-900/10 p-8 shadow-sm backdrop-blur-2xl transition-all duration-500 hover:border-blue-500 col-span-full">
        <div className="absolute right-0 bottom-0 -mr-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-2xl bg-blue-500/10 p-4 mb-4 ring-1 ring-blue-500/20">
            <CalendarDays className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">No Timetable Generated</h3>
          <p className="text-muted-foreground max-w-md">
            You haven't generated a master timetable yet. Head over to the Timetable Engine to create your school's schedule.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-background/50 shadow-sm backdrop-blur-2xl transition-all duration-500 col-span-full flex flex-col">
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl z-0 pointer-events-none" />
      
      <div className="relative z-10 p-6 pb-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-foreground">Today's Schedule</h3>
              <p className="text-sm font-medium text-muted-foreground">All Teachers • {currentDay}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          <div className="grid gap-3" style={{ gridTemplateColumns: `100px repeat(${teachers.length}, minmax(200px, 1fr))` }}>
            
            {/* Time Column */}
            <div className="space-y-3">
              <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
              {dynamicPeriods.map(time => {
                const isBreak = checkBreakOverlap(time, customBreaks);
                return (
                  <div key={time} className={`${isBreak ? "h-24" : "h-24"} flex flex-col items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-2xl border border-border/30`}>
                    <Clock size={14} className="mb-1 opacity-50" />
                    <span>{time.split(" - ")[0]}</span>
                    <span className="opacity-50 text-[10px]">to</span>
                    <span>{time.split(" - ")[1]}</span>
                  </div>
                )
              })}
            </div>

            {/* Teacher Columns */}
            {teachers.map(teacher => (
              <div key={teacher.id} className="space-y-3">
                <div className="h-12 flex items-end justify-center pb-2 text-sm font-bold text-foreground border-b border-border/50 truncate px-2 font-heading text-lg text-primary">
                  {teacher.name}
                </div>
                {dynamicPeriods.map((time, index) => {
                  if (checkBreakOverlap(time, customBreaks)) {
                    const b = checkBreakOverlap(time, customBreaks);
                    return (
                      <div key={index} className="h-24 bg-muted/50 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                        <span className="bg-background/95 px-5 py-2 rounded-full border border-border text-foreground font-heading font-bold tracking-[0.2em] uppercase text-xs relative z-10 shadow-sm backdrop-blur-md">{b?.name}</span>
                      </div>
                    )
                  }

                  const slot = getTeacherSlot(teacher.id, currentDay, index);
                  
                  if (!slot) {
                    return (
                      <div key={index} className="h-24 bg-background/40 hover:bg-muted/30 rounded-2xl flex items-center justify-center border border-dashed border-border/50 transition-colors">
                        <span className="text-sm font-medium text-muted-foreground/40 italic">Free</span>
                      </div>
                    )
                  }

                  return (
                    <div key={index} className="h-24 bg-card hover:bg-accent/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 border border-border/60 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 relative group/slot">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 rounded-l-2xl group-hover/slot:bg-primary transition-colors" />
                      <span className="font-heading font-bold text-base text-foreground text-center line-clamp-1">{slot.subject?.name}</span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-md">
                        <GraduationCap className="h-3 w-3" />
                        <span>Class {slot.classInfo?.name} {slot.classInfo?.division}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}

          </div>
        </div>
      </div>

    </div>
  );
}
