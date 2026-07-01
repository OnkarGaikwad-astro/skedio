"use client";

import { useState, useMemo, useEffect } from "react";
import { Sparkles, Calendar as CalendarIcon, Download, SlidersHorizontal, RefreshCcw, Clock, Users, User, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { Break } from "@/app/actions/break";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type ViewMode = "class" | "teacher" | "master";

function generatePeriods(startTime: string, endTime: string, slotLengthMins: number) {
  const periods = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentTotalMins = startHour * 60 + startMin;
  const endTotalMins = endHour * 60 + endMin;
  
  while (currentTotalMins + slotLengthMins <= endTotalMins) {
    const sH = Math.floor(currentTotalMins / 60).toString().padStart(2, '0');
    const sM = (currentTotalMins % 60).toString().padStart(2, '0');
    
    currentTotalMins += slotLengthMins;
    
    const eH = Math.floor(currentTotalMins / 60).toString().padStart(2, '0');
    const eM = (currentTotalMins % 60).toString().padStart(2, '0');
    
    periods.push(`${sH}:${sM} - ${eH}:${eM}`);
  }
  
  return periods;
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

export function TimetableClient({ classes, teachers, subjects, customBreaks }: { classes: any[], teachers: any[], subjects: any[], customBreaks: Break[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("class");
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || "");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, any>>({});
  
  // Settings State
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("15:30");
  const [slotDuration, setSlotDuration] = useState("45");

  const dynamicPeriods = useMemo(() => {
    return generatePeriods(startTime, endTime, parseInt(slotDuration));
  }, [startTime, endTime, slotDuration]);

  // If settings change, clear schedule to force regeneration
  useEffect(() => {
    setSchedule({});
  }, [startTime, endTime, slotDuration]);

  const generateTimetable = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSchedule: Record<string, any> = {};
      
      // Generate for all classes
      classes.forEach(cls => {
        DAYS.forEach((day) => {
          let lastSubjectId: string | null = null; // Track the last subject assigned

          dynamicPeriods.forEach((time, index) => {
            const matchedBreak = checkBreakOverlap(time, customBreaks);
            
            if (matchedBreak) {
              newSchedule[`${cls.id}-${day}-${index}`] = { type: "BREAK", name: matchedBreak.name };
            } else {
              let assignedSubject = null;
              let assignedTeacher = null;

              if (index === 0 && cls.classTeacherId) {
                // First period of the day: Assign the Class Teacher
                assignedTeacher = teachers.find(t => t.id === cls.classTeacherId);
                
                if (assignedTeacher) {
                  // Try to pick one of their specialized subjects, otherwise pick random
                  if (assignedTeacher.subjectIds && assignedTeacher.subjectIds.length > 0) {
                    const validSubjects = subjects.filter(s => assignedTeacher.subjectIds.includes(s.id));
                    assignedSubject = validSubjects.length > 0 
                      ? validSubjects[Math.floor(Math.random() * validSubjects.length)] 
                      : subjects[Math.floor(Math.random() * subjects.length)];
                  } else {
                    assignedSubject = subjects[Math.floor(Math.random() * subjects.length)];
                  }
                }
              }
              
              // If not first period, or Class Teacher assignment failed, do normal logic
              if (!assignedTeacher || !assignedSubject) {
                // Prevent consecutive subjects if there are multiple subjects available
                let availableSubjects = subjects;
                if (lastSubjectId && subjects.length > 1) {
                  const filtered = subjects.filter(s => s.id !== lastSubjectId);
                  if (filtered.length > 0) {
                    availableSubjects = filtered;
                  }
                }

                assignedSubject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
                
                const qualifiedTeachers = teachers.filter(t => 
                  !t.subjectIds || t.subjectIds.length === 0 || t.subjectIds.includes(assignedSubject?.id)
                );
                
                const availableTeachers = qualifiedTeachers.length > 0 ? qualifiedTeachers : teachers;
                assignedTeacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
              }
              
              if (assignedSubject && assignedTeacher) {
                newSchedule[`${cls.id}-${day}-${index}`] = {
                  type: "CLASS",
                  subject: assignedSubject,
                  teacher: assignedTeacher,
                  classInfo: cls,
                };
                // Update last subject ID to prevent it from being picked next period
                lastSubjectId = assignedSubject.id;
              }
            }
          });
        });
      });

      setSchedule(newSchedule);
      setIsGenerating(false);
    }, 1500);
  };

  // Helper to find a teacher's class for a specific day and period
  const getTeacherSlot = (teacherId: string, day: string, periodIndex: number) => {
    for (const cls of classes) {
      const slot = schedule[`${cls.id}-${day}-${periodIndex}`];
      if (slot && slot.type === "CLASS" && slot.teacher?.id === teacherId) {
        return slot;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Top View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-muted/50 p-1 rounded-[16px] border border-border/50">
          <button 
            onClick={() => setViewMode("class")}
            className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "class" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <GraduationCap size={16} /> By Class
          </button>
          <button 
            onClick={() => setViewMode("teacher")}
            className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "teacher" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <User size={16} /> By Teacher
          </button>
          <button 
            onClick={() => setViewMode("master")}
            className={`px-4 py-2 rounded-[12px] text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "master" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <Users size={16} /> Master (All)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={generateTimetable}
            disabled={isGenerating || classes.length === 0 || subjects.length === 0 || dynamicPeriods.length === 0}
            className="h-10 px-5 rounded-[14px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-[0_4px_14px_rgba(0,78,100,0.25)] hover:shadow-[0_6px_20px_rgba(0,78,100,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            {isGenerating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {Object.keys(schedule).length > 0 ? "Regenerate AI Schedule" : "Generate Smart Schedule"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end justify-between border-b border-border/50 pb-4 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          
          {viewMode === "class" && (
            <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Select Class</Label>
              <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val)}>
                <SelectTrigger className="w-48 rounded-[14px] bg-background">
                  <SelectValue placeholder="Select a class">
                    {classes.find(c => c.id === selectedClass) 
                      ? `${classes.find(c => c.id === selectedClass)?.name} - ${classes.find(c => c.id === selectedClass)?.division}`
                      : "Select a class"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.division}</SelectItem>
                  ))}
                  {classes.length === 0 && <SelectItem value="none" disabled>No classes available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewMode === "teacher" && (
            <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Select Teacher</Label>
              <Select value={selectedTeacher} onValueChange={(val) => setSelectedTeacher(val)}>
                <SelectTrigger className="w-48 rounded-[14px] bg-background">
                  <SelectValue placeholder="Select a teacher">
                    {teachers.find(t => t.id === selectedTeacher)?.name || "Select a teacher"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                  {teachers.length === 0 && <SelectItem value="none" disabled>No teachers available</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewMode === "master" && (
            <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Select Day</Label>
              <Select value={selectedDay} onValueChange={(val) => setSelectedDay(val)}>
                <SelectTrigger className="w-48 rounded-[14px] bg-background">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Week">All Week</SelectItem>
                  {DAYS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="h-10 border-r border-border/50 mx-2 self-end"></div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start Time</Label>
            <input 
              type="time" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 px-3 rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-32"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">End Time</Label>
            <input 
              type="time" 
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 px-3 rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-32"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Slot Duration</Label>
            <Select value={slotDuration} onValueChange={setSlotDuration}>
              <SelectTrigger className="w-36 rounded-[14px] bg-background">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 mins</SelectItem>
                <SelectItem value="40">40 mins</SelectItem>
                <SelectItem value="45">45 mins</SelectItem>
                <SelectItem value="50">50 mins</SelectItem>
                <SelectItem value="60">60 mins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto rounded-[18px] border border-border/50 bg-background/50 relative">
        {Object.keys(schedule).length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-1000">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon size={32} className="text-primary/40" />
            </div>
            <h3 className="font-heading text-xl text-foreground font-medium mb-1">No Timetable Generated</h3>
            <p className="text-sm max-w-md text-center">Configure the timeline settings above and click "Generate Smart Schedule".</p>
          </div>
        ) : (
          <div className="min-w-max h-full p-4 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* --- CLASS VIEW --- */}
            {viewMode === "class" && (
              <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, minmax(180px, 1fr))` }}>
                <div className="space-y-3">
                  <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
                  {dynamicPeriods.map(time => (
                    <div key={time} className="h-24 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
                      <Clock size={12} className="mr-1.5 opacity-50" />
                      {time}
                    </div>
                  ))}
                </div>
                {DAYS.map(day => (
                  <div key={day} className="space-y-3">
                    <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50">{day}</div>
                    {dynamicPeriods.map((time, index) => {
                      const slot = schedule[`${selectedClass}-${day}-${index}`];
                      
                      if (checkBreakOverlap(time, customBreaks)) {
                        const b = checkBreakOverlap(time, customBreaks);
                        return (
                          <div key={index} className="h-24 bg-sidebar-primary/10 rounded-[14px] border border-sidebar-primary/20 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                            <span className="text-sidebar-primary font-heading font-semibold tracking-widest uppercase text-sm relative z-10">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      if (!slot) return <div key={index} className="h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Empty</div>;
                      
                      return (
                        <div key={index} className="h-24 bg-card hover:bg-muted/50 rounded-[14px] border border-border/80 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm hover:shadow-md">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-primary line-clamp-1">{slot.subject?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-auto">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                              {slot.teacher?.name?.charAt(0) || "T"}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">{slot.teacher?.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* --- TEACHER VIEW --- */}
            {viewMode === "teacher" && (
              <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, minmax(180px, 1fr))` }}>
                <div className="space-y-3">
                  <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
                  {dynamicPeriods.map(time => (
                    <div key={time} className="h-24 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
                      <Clock size={12} className="mr-1.5 opacity-50" />
                      {time}
                    </div>
                  ))}
                </div>
                {DAYS.map(day => (
                  <div key={day} className="space-y-3">
                    <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50">{day}</div>
                    {dynamicPeriods.map((time, index) => {
                      if (checkBreakOverlap(time, customBreaks)) {
                        const b = checkBreakOverlap(time, customBreaks);
                        return (
                          <div key={index} className="h-24 bg-sidebar-primary/10 rounded-[14px] border border-sidebar-primary/20 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                            <span className="text-sidebar-primary font-heading font-semibold tracking-widest uppercase text-sm relative z-10">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      const slot = getTeacherSlot(selectedTeacher, day, index);
                      
                      if (!slot) return <div key={index} className="h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Free Period</div>;

                      return (
                        <div key={index} className="h-24 bg-amber-500/10 hover:bg-amber-500/20 rounded-[14px] border border-amber-500/20 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm hover:shadow-md">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-sm text-amber-600 dark:text-amber-400 line-clamp-1">{slot.subject?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-auto">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-600 dark:text-amber-400">
                              <GraduationCap size={10} />
                            </div>
                            <span className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 truncate">
                              {slot.classInfo?.name} {slot.classInfo?.division}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* --- MASTER VIEW (ALL TEACHERS) --- */}
            {viewMode === "master" && (
              <div className="flex flex-col gap-8 h-full">
                {(selectedDay === "All Week" ? DAYS : [selectedDay]).map((currentDay) => (
                  <div key={currentDay} className="flex flex-col">
                    {selectedDay === "All Week" && (
                      <h4 className="text-lg font-heading font-semibold text-foreground mb-4 pl-2 border-l-4 border-primary">
                        {currentDay}
                      </h4>
                    )}
                    <div className="grid gap-3" style={{ gridTemplateColumns: `100px repeat(${teachers.length}, minmax(180px, 1fr))` }}>
                      <div className="space-y-3">
                        <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
                        {dynamicPeriods.map(time => (
                          <div key={time} className="h-24 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
                            <Clock size={12} className="mr-1.5 opacity-50" />
                            {time}
                          </div>
                        ))}
                      </div>
                      {teachers.map(teacher => (
                        <div key={teacher.id} className="space-y-3">
                          <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50 truncate px-2">
                            {teacher.name}
                          </div>
                          {dynamicPeriods.map((time, index) => {
                            if (checkBreakOverlap(time, customBreaks)) {
                              const b = checkBreakOverlap(time, customBreaks);
                              return (
                                <div key={index} className="h-24 bg-sidebar-primary/5 rounded-[14px] border border-sidebar-primary/10 flex items-center justify-center relative overflow-hidden group">
                                  <span className="text-sidebar-primary/50 font-heading tracking-widest uppercase text-xs relative z-10">{b?.name}</span>
                                </div>
                              )
                            }

                            const slot = getTeacherSlot(teacher.id, currentDay, index);
                            
                            if (!slot) return <div key={index} className="h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Free</div>;

                            return (
                              <div key={index} className="h-24 bg-blue-500/10 hover:bg-blue-500/20 rounded-[14px] border border-blue-500/20 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm">
                                <div className="flex justify-between items-start">
                                  <span className="font-semibold text-sm text-blue-600 dark:text-blue-400 line-clamp-1">{slot.subject?.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-auto">
                                  <span className="text-xs font-medium text-blue-700/80 dark:text-blue-300/80 truncate">
                                    Class: {slot.classInfo?.name} {slot.classInfo?.division}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
