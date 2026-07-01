"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Sparkles, Calendar as CalendarIcon, Download, SlidersHorizontal, RefreshCcw, Clock, Users, User, GraduationCap, FileDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { saveTimetable } from "@/app/actions/timetable";
import { Break } from "@/app/actions/break";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type ViewMode = "class" | "teacher" | "master";

function minsToTime(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
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
      
      // If we are currently inside a break
      if (currentMins >= bStart && currentMins < bEnd) {
        periods.push(`${minsToTime(bStart)} - ${minsToTime(bEnd)}`);
        currentMins = bEnd;
        handledByBreak = true;
        break;
      }
      
      // If the NEXT normal period overlaps with a break
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
  
  // Also push any remaining breaks that might fit exactly at the end
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

export function TimetableClient({ classes, teachers, subjects, customBreaks, initialTimetable }: { classes: any[], teachers: any[], subjects: any[], customBreaks: Break[], initialTimetable?: any }) {
  const [viewMode, setViewMode] = useState<ViewMode>("class");
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.id || "");
  const [selectedTeacher, setSelectedTeacher] = useState<string>(teachers[0]?.id || "");
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const timetableRef = useRef<HTMLDivElement>(null);
  
  // Settings State - Load from initialTimetable if it exists
  const [schedule, setSchedule] = useState<Record<string, any>>(initialTimetable?.scheduleData || {});
  const [startTime, setStartTime] = useState(initialTimetable?.settings?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialTimetable?.settings?.endTime || "15:30");
  const [slotDuration, setSlotDuration] = useState(initialTimetable?.settings?.slotDuration || "45");

  const dynamicPeriods = useMemo(() => {
    return generatePeriods(startTime, endTime, parseInt(slotDuration), customBreaks);
  }, [startTime, endTime, slotDuration, customBreaks]);

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
          let lastTeacherId: string | null = null; // Track the last teacher assigned

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
                
                let availableTeachers = qualifiedTeachers.length > 0 ? qualifiedTeachers : teachers;
                
                // Prevent consecutive teachers if there are multiple teachers available
                if (lastTeacherId && availableTeachers.length > 1) {
                  const filteredTeachers = availableTeachers.filter(t => t.id !== lastTeacherId);
                  if (filteredTeachers.length > 0) {
                    availableTeachers = filteredTeachers;
                  }
                }

                assignedTeacher = availableTeachers[Math.floor(Math.random() * availableTeachers.length)];
              }
              
              if (assignedSubject && assignedTeacher) {
                newSchedule[`${cls.id}-${day}-${index}`] = {
                  type: "CLASS",
                  subject: assignedSubject,
                  teacher: assignedTeacher,
                  classInfo: cls,
                };
                // Update last subject & teacher ID to prevent them from being picked next period
                lastSubjectId = assignedSubject.id;
                lastTeacherId = assignedTeacher.id;
              }
            }
          });
        });
      });

      setSchedule(newSchedule);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (Object.keys(schedule).length === 0) return;
    setIsSaving(true);
    try {
      await saveTimetable(schedule, { startTime, endTime, slotDuration });
      alert("Timetable saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save timetable: ${err.message || "Unknown error"}. Did you run the SQL script?`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = async () => {
    if (!timetableRef.current || Object.keys(schedule).length === 0) return;
    setIsExporting(true);
    
    try {
      const { toPng } = await import('html-to-image');
      
      const dataUrl = await toPng(timetableRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("School_Timetable.pdf");
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
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
            className="h-10 px-5 rounded-[14px] bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {isGenerating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {Object.keys(schedule).length > 0 ? "Regenerate AI Schedule" : "Generate Smart Schedule"}
          </button>
          
          <button 
            onClick={exportToPDF}
            disabled={isExporting || Object.keys(schedule).length === 0}
            className="h-10 px-5 rounded-[14px] bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {isExporting ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
            Export PDF
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving || Object.keys(schedule).length === 0}
            className="h-10 px-5 rounded-[14px] bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-[0_4px_14px_rgba(0,78,100,0.25)] hover:shadow-[0_6px_20px_rgba(0,78,100,0.3)] disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Download size={16} />}
            Save Timetable
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
      <div className="flex-1 overflow-auto rounded-[18px] border border-border/50 bg-background/50 relative snap-y snap-mandatory">
        {Object.keys(schedule).length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-1000">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon size={32} className="text-primary/40" />
            </div>
            <h3 className="font-heading text-xl text-foreground font-medium mb-1">No Timetable Generated</h3>
            <p className="text-sm max-w-md text-center">Configure the timeline settings above and click "Generate Smart Schedule".</p>
          </div>
        ) : (
          <div ref={timetableRef} className="min-w-max min-h-full p-4 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* --- CLASS VIEW --- */}
            {viewMode === "class" && (
              <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `100px repeat(${DAYS.length}, minmax(180px, 1fr))` }}>
                <div className="space-y-3">
                  <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
                  {dynamicPeriods.map(time => (
                    <div key={time} className="h-20 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
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
                          <div key={index} className="h-20 bg-sidebar-primary/10 rounded-[14px] border border-sidebar-primary/20 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                            <span className="text-sidebar-primary font-heading font-semibold tracking-widest uppercase text-sm relative z-10">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      if (!slot) return <div key={index} className="h-20 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Empty</div>;
                      
                      return (
                        <div key={index} className="h-20 bg-card hover:bg-muted/50 rounded-[14px] border border-border/80 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm hover:shadow-md">
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
                    <div key={time} className="h-20 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
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
                          <div key={index} className="h-20 bg-sidebar-primary/10 rounded-[14px] border border-sidebar-primary/20 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10"></div>
                            <span className="text-sidebar-primary font-heading font-semibold tracking-widest uppercase text-sm relative z-10">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      const slot = getTeacherSlot(selectedTeacher, day, index);
                      
                      if (!slot) return <div key={index} className="h-20 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Free Period</div>;

                      return (
                        <div key={index} className="h-20 bg-amber-500/10 hover:bg-amber-500/20 rounded-[14px] border border-amber-500/20 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm hover:shadow-md">
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
              <div className="flex flex-col min-h-full snap-y snap-mandatory">
                {(selectedDay === "All Week" ? DAYS : [selectedDay]).map((currentDay) => (
                  <div key={currentDay} className="flex flex-col min-h-full snap-start shrink-0 pt-2 pb-8">
                    {selectedDay === "All Week" && (
                      <h4 className="text-lg font-heading font-semibold text-foreground mb-4 pl-2 border-l-4 border-primary sticky left-0">
                        {currentDay}
                      </h4>
                    )}
                    <div className="grid gap-3" style={{ gridTemplateColumns: `100px repeat(${teachers.length}, minmax(180px, 1fr))` }}>
                      <div className="space-y-3">
                        <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Time</div>
                        {dynamicPeriods.map(time => (
                          <div key={time} className="h-20 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30">
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
                                <div key={index} className="h-20 bg-sidebar-primary/5 rounded-[14px] border border-sidebar-primary/10 flex items-center justify-center relative overflow-hidden group">
                                  <span className="text-sidebar-primary/50 font-heading tracking-widest uppercase text-xs relative z-10">{b?.name}</span>
                                </div>
                              )
                            }

                            const slot = getTeacherSlot(teacher.id, currentDay, index);
                            
                            if (!slot) return <div key={index} className="h-20 bg-card rounded-[14px] border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 text-xs">Free</div>;

                            return (
                              <div key={index} className="h-20 bg-blue-500/10 hover:bg-blue-500/20 rounded-[14px] border border-blue-500/20 p-3 flex flex-col justify-between group cursor-grab transition-colors shadow-sm">
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
