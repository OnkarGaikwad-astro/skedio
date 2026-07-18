"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Sparkles, Calendar as CalendarIcon, Download, SlidersHorizontal, RefreshCcw, Clock, Users, User, GraduationCap, FileDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSaturdaySettingsOpen, setIsSaturdaySettingsOpen] = useState(false);
  const [exportType, setExportType] = useState<"current" | "master" | "all-classes" | "class" | "teacher">("current");
  const [exportEntityId, setExportEntityId] = useState<string>("");
  
  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSlotData, setEditSlotData] = useState<{
    isOpen: boolean;
    classId: string;
    originalClassId?: string;
    day: string;
    index: number;
    time: string;
    currentType: "CLASS" | "FREE" | "BREAK";
    currentSubjectId?: string;
    currentTeacherId?: string;
    breakName?: string;
    customTime?: string;
    sourceView: "class" | "teacher" | "master";
  }>({ isOpen: false, classId: "", day: "", index: -1, time: "", currentType: "FREE", sourceView: "class" });
  
  const timetableRef = useRef<HTMLDivElement>(null);
  
  // Settings State - Load from initialTimetable if it exists
  const [schedule, setSchedule] = useState<Record<string, any>>(initialTimetable?.scheduleData || {});
  const [startTime, setStartTime] = useState(initialTimetable?.settings?.startTime || "10:50");
  const [endTime, setEndTime] = useState(initialTimetable?.settings?.endTime || "16:30");
  const [slotDuration, setSlotDuration] = useState(initialTimetable?.settings?.slotDuration || "35");
  const [isSaturdayEnabled, setIsSaturdayEnabled] = useState(initialTimetable?.settings?.isSaturdayEnabled ?? true);
  const [saturdayStartTime, setSaturdayStartTime] = useState(initialTimetable?.settings?.saturdayStartTime || "07:30");
  const [saturdayEndTime, setSaturdayEndTime] = useState(initialTimetable?.settings?.saturdayEndTime || "12:00");

  const activeDays = useMemo(() => isSaturdayEnabled ? [...DAYS, "Saturday"] : DAYS, [isSaturdayEnabled]);

  const weekdayBreaks = useMemo(() => customBreaks.filter(b => b.applyTo === "ALL" || b.applyTo === "WEEKDAYS" || !b.applyTo), [customBreaks]);
  const saturdayBreaks = useMemo(() => customBreaks.filter(b => b.applyTo === "ALL" || b.applyTo === "SATURDAY" || !b.applyTo), [customBreaks]);

  const dynamicPeriods = useMemo(() => {
    return generatePeriods(startTime, endTime, parseInt(slotDuration), weekdayBreaks);
  }, [startTime, endTime, slotDuration, weekdayBreaks]);

  const saturdayPeriods = useMemo(() => {
    return generatePeriods(saturdayStartTime, saturdayEndTime, parseInt(slotDuration), saturdayBreaks);
  }, [saturdayStartTime, saturdayEndTime, slotDuration, saturdayBreaks]);

  const maxPeriodsCount = Math.max(dynamicPeriods.length, isSaturdayEnabled ? saturdayPeriods.length : 0);

  const prevSettings = useRef({ startTime, endTime, slotDuration, isSaturdayEnabled, saturdayStartTime, saturdayEndTime });

  // Sync state if initialTimetable prop changes (e.g., from server navigation)
  useEffect(() => {
    if (initialTimetable?.scheduleData) {
      setSchedule(initialTimetable.scheduleData);
      const st = initialTimetable.settings?.startTime || "10:50";
      const et = initialTimetable.settings?.endTime || "16:30";
      const sd = initialTimetable.settings?.slotDuration || "35";
      const satEnabled = initialTimetable.settings?.isSaturdayEnabled ?? true;
      const satSt = initialTimetable.settings?.saturdayStartTime || "07:30";
      const satEt = initialTimetable.settings?.saturdayEndTime || "12:00";
      setStartTime(st);
      setEndTime(et);
      setSlotDuration(sd);
      setIsSaturdayEnabled(satEnabled);
      setSaturdayStartTime(satSt);
      setSaturdayEndTime(satEt);
      prevSettings.current = { startTime: st, endTime: et, slotDuration: sd, isSaturdayEnabled: satEnabled, saturdayStartTime: satSt, saturdayEndTime: satEt };
    }
  }, [initialTimetable]);

  // If settings actually change from user input, clear schedule to force regeneration
  useEffect(() => {
    const hasChanged = 
      prevSettings.current.startTime !== startTime ||
      prevSettings.current.endTime !== endTime ||
      prevSettings.current.slotDuration !== slotDuration ||
      prevSettings.current.isSaturdayEnabled !== isSaturdayEnabled ||
      prevSettings.current.saturdayStartTime !== saturdayStartTime ||
      prevSettings.current.saturdayEndTime !== saturdayEndTime;

    if (hasChanged) {
      setSchedule({});
      prevSettings.current = { startTime, endTime, slotDuration, isSaturdayEnabled, saturdayStartTime, saturdayEndTime };
    }
  }, [startTime, endTime, slotDuration, isSaturdayEnabled, saturdayStartTime, saturdayEndTime]);

  const generateTimetable = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newSchedule: Record<string, any> = {};
      
      const teacherWorkload: Record<string, number> = {};
      teachers.forEach(t => teacherWorkload[t.id] = 0);
      
      const classSubjectTeacherMap: Record<string, Record<string, any>> = {};
      const subjectWeeklyCount: Record<string, Record<string, number>> = {};
      const subjectDailyCount: Record<string, Record<string, Record<string, number>>> = {};
      
      classes.forEach(c => {
        classSubjectTeacherMap[c.id] = {};
        subjectWeeklyCount[c.id] = {};
        subjectDailyCount[c.id] = {};
        activeDays.forEach(day => subjectDailyCount[c.id][day] = {});
      });
      
      activeDays.forEach((day) => {
        const periodsToUse = day === "Saturday" ? saturdayPeriods : dynamicPeriods;
        periodsToUse.forEach((time, index) => {
          const matchedBreak = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
          
          if (matchedBreak) {
            // Assign break to all classes at this time
            classes.forEach(cls => {
              newSchedule[`${cls.id}-${day}-${index}`] = { type: "BREAK", name: matchedBreak.name };
            });
            return;
          }
          
          // Track which teachers are already teaching a class during this specific time slot
          const busyTeachersAtSlot = new Set<string>();

          classes.forEach(cls => {
            let assignedSubject: any = null;
            let assignedTeacher: any = null;

            // Determine available subjects for this class
            let classAvailableSubjects = cls.subjectIds && cls.subjectIds.length > 0 
              ? subjects.filter(s => cls.subjectIds.includes(s.id))
              : subjects;
              
            // Smart Distribution: Sort subjects to prioritize those taught least often today and this week
            classAvailableSubjects = [...classAvailableSubjects].sort((a, b) => {
              const countA = (subjectWeeklyCount[cls.id][a.id] || 0) * 10 + (subjectDailyCount[cls.id][day][a.id] || 0) * 50 + Math.random();
              const countB = (subjectWeeklyCount[cls.id][b.id] || 0) * 10 + (subjectDailyCount[cls.id][day][b.id] || 0) * 50 + Math.random();
              return countA - countB;
            });

            // First period constraint: Try to assign the Class Teacher
            if (index === 0 && cls.classTeacherId && !busyTeachersAtSlot.has(cls.classTeacherId)) {
              const ct = teachers.find(t => t.id === cls.classTeacherId);
              if (ct) {
                let validCTSubjects = classAvailableSubjects.filter(s => 
                  !ct.subjectIds || ct.subjectIds.length === 0 || ct.subjectIds.includes(s.id)
                );
                
                const mappedCTSubjects = validCTSubjects.filter(s => classSubjectTeacherMap[cls.id][s.id]?.id === ct.id);
                if (mappedCTSubjects.length > 0) {
                  assignedSubject = mappedCTSubjects[0];
                  assignedTeacher = ct;
                } else {
                  const unmappedCTSubjects = validCTSubjects.filter(s => !classSubjectTeacherMap[cls.id][s.id]);
                  if (unmappedCTSubjects.length > 0) {
                    assignedSubject = unmappedCTSubjects[0];
                    assignedTeacher = ct;
                    classSubjectTeacherMap[cls.id][assignedSubject.id] = ct;
                  }
                }
              }
            }

            // Normal assignment
            if (!assignedTeacher || !assignedSubject) {
              // 1. Try to find a subject that is already mapped to a free teacher, avoiding consecutive periods
              for (const subject of classAvailableSubjects) {
                const mappedTeacher = classSubjectTeacherMap[cls.id][subject.id];
                if (mappedTeacher && !busyTeachersAtSlot.has(mappedTeacher.id)) {
                  const prevSlot = newSchedule[`${cls.id}-${day}-${index - 1}`];
                  const isConsecutive = prevSlot && prevSlot.type === "CLASS" && prevSlot.subject?.id === subject.id;
                  
                  if (!isConsecutive) {
                    assignedSubject = subject;
                    assignedTeacher = mappedTeacher;
                    break;
                  }
                }
              }

              // 2. If no mapped teacher is free (or only consecutive), try to map a NEW teacher to an unmapped subject
              if (!assignedTeacher) {
                const unmappedSubjects = classAvailableSubjects.filter(s => !classSubjectTeacherMap[cls.id][s.id]);
                
                for (const subject of unmappedSubjects) {
                  const qualifiedTeachers = teachers.filter(t => 
                    !t.subjectIds || t.subjectIds.length === 0 || t.subjectIds.includes(subject.id)
                  );
                  
                  const availableTeachers = qualifiedTeachers.filter(t => !busyTeachersAtSlot.has(t.id));
                  
                  if (availableTeachers.length > 0) {
                    // FAIRNESS: Sort by workload ascending
                    availableTeachers.sort((a, b) => teacherWorkload[a.id] - teacherWorkload[b.id]);
                    
                    assignedSubject = subject;
                    assignedTeacher = availableTeachers[0];
                    classSubjectTeacherMap[cls.id][subject.id] = assignedTeacher;
                    break;
                  }
                }
              }
              
              // 3. Fallback: Allow consecutive period if mapped teacher is free
              if (!assignedTeacher) {
                for (const subject of classAvailableSubjects) {
                  const mappedTeacher = classSubjectTeacherMap[cls.id][subject.id];
                  if (mappedTeacher && !busyTeachersAtSlot.has(mappedTeacher.id)) {
                    assignedSubject = subject;
                    assignedTeacher = mappedTeacher;
                    break;
                  }
                }
              }
            }

            if (assignedSubject && assignedTeacher) {
              newSchedule[`${cls.id}-${day}-${index}`] = {
                type: "CLASS",
                subject: assignedSubject,
                teacher: assignedTeacher,
                classInfo: cls,
              };
              busyTeachersAtSlot.add(assignedTeacher.id);
              teacherWorkload[assignedTeacher.id]++;
              subjectWeeklyCount[cls.id][assignedSubject.id] = (subjectWeeklyCount[cls.id][assignedSubject.id] || 0) + 1;
              subjectDailyCount[cls.id][day][assignedSubject.id] = (subjectDailyCount[cls.id][day][assignedSubject.id] || 0) + 1;
            } else {
              // Constraints could not be resolved -> Free Period
              newSchedule[`${cls.id}-${day}-${index}`] = { type: "FREE" };
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
      await saveTimetable(schedule, { startTime, endTime, slotDuration, isSaturdayEnabled, saturdayStartTime, saturdayEndTime });
      alert("Timetable saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save timetable: ${err.message || "Unknown error"}. Did you run the SQL script?`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = async () => {
    setIsExportDialogOpen(false);
    setIsExporting(true);

    try {
      setIsExporting(true);

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();

      const customDrawCell = (data: any) => {
        const pdfDoc = data.doc;
        if (data.section === 'body') {
          const cx = data.cell.x + data.cell.width / 2;
          const cy = data.cell.y + data.cell.height / 2;
          const customData = data.cell.raw?.customData || {};

          const margin = 1.5;
          const x = data.cell.x + margin;
          const y = data.cell.y + margin;
          const w = data.cell.width - (margin * 2);
          const h = data.cell.height - (margin * 2);
          const radius = 4; // larger curves like the app

          if (data.column.index === 0) {
            pdfDoc.setFillColor(248, 250, 252);
            pdfDoc.roundedRect(x, y, w, h, radius, radius, "F");
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(9);
            pdfDoc.setTextColor(100, 116, 139);
            pdfDoc.text(customData.name || data.cell.text[0] || "", cx, cy, { align: "center", baseline: "middle" });
          } else {
            if (customData.type === 'break') {
              pdfDoc.setFillColor(248, 250, 252);
              pdfDoc.setDrawColor(226, 232, 240);
              pdfDoc.setLineWidth(0.3);
              pdfDoc.roundedRect(x, y, w, h, radius, radius, "FD");
              
              pdfDoc.setFont("helvetica", "bold");
              pdfDoc.setFontSize(8.5);
              const nameLines = pdfDoc.splitTextToSize(customData.name || "", w - 2);
              
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(6.5);
              const timeLines = pdfDoc.splitTextToSize(customData.time || "", w - 2);
              
              const totalLines = nameLines.length + timeLines.length;
              const lineSpacing = 3.2;
              let currentY = cy - ((totalLines - 1) * lineSpacing) / 2;
              
              pdfDoc.setFont("helvetica", "bold");
              pdfDoc.setFontSize(8.5);
              pdfDoc.setTextColor(100, 116, 139);
              pdfDoc.text(nameLines, cx, currentY, { align: "center", baseline: "middle" });
              currentY += lineSpacing * nameLines.length;
              
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(6.5);
              pdfDoc.setTextColor(148, 163, 184);
              pdfDoc.text(timeLines, cx, currentY, { align: "center", baseline: "middle" });
            } else if (customData.type === 'slot') {
              pdfDoc.setFillColor(244, 249, 252);
              pdfDoc.setDrawColor(219, 234, 244);
              pdfDoc.setLineWidth(0.3);
              pdfDoc.roundedRect(x, y, w, h, radius, radius, "FD");
              
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(7.5);
              const timeLines = pdfDoc.splitTextToSize(customData.time || "", w - 2);
              
              pdfDoc.setFont("helvetica", "bold");
              pdfDoc.setFontSize(10.5);
              const subjectLines = pdfDoc.splitTextToSize(customData.subject || "", w - 2);
              
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(8.5);
              const teacherLines = pdfDoc.splitTextToSize(customData.teacher || "", w - 2);
              
              const totalLines = subjectLines.length;
              const lineSpacing = 4.2;
              let currentY = cy - ((totalLines - 1) * lineSpacing) / 2;
              
              // Time (Top Left)
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(7.5);
              pdfDoc.setTextColor(148, 163, 184);
              pdfDoc.text(timeLines, x + 3, y + 2.5, { align: "left", baseline: "top" });
              
              // Subject (Centered)
              pdfDoc.setFont("helvetica", "bold");
              pdfDoc.setFontSize(10.5);
              pdfDoc.setTextColor(0, 78, 100);
              pdfDoc.text(subjectLines, cx, currentY, { align: "center", baseline: "middle" });
              
              // Teacher (Bottom Center)
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(8.5);
              pdfDoc.setTextColor(100, 116, 139);
              let teacherY = (y + h - 2.5) - (teacherLines.length - 1) * 3.5;
              pdfDoc.text(teacherLines, cx, teacherY, { align: "center", baseline: "bottom" });
            } else {
              pdfDoc.setDrawColor(241, 245, 249);
              pdfDoc.setLineWidth(0.5);
              pdfDoc.setLineDashPattern([1.5, 1.5], 0);
              pdfDoc.roundedRect(x, y, w, h, radius, radius, "S");
              pdfDoc.setLineDashPattern([], 0);
              pdfDoc.setFont("helvetica", "normal");
              pdfDoc.setFontSize(8);
              pdfDoc.setTextColor(203, 213, 225);
              pdfDoc.text("Free", cx, cy, { align: "center", baseline: "middle" });
            }
          }
        }
      };

      const tableStyles = {
        theme: 'plain' as const,
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 2, halign: 'center' as const, valign: 'middle' as const },
        headStyles: { fillColor: [248, 250, 252] as [number, number, number], textColor: [15, 23, 42] as [number, number, number], fontStyle: 'bold' as const },
        didDrawCell: customDrawCell,
        rowPageBreak: 'avoid' as const
      };

      const generateTableForClass = (classData: any, startY: number = 20) => {
        pdf.setFontSize(16);
        pdf.text(`Timetable - Class ${classData.name} ${classData.division}`, pageWidth / 2, startY, { align: "center" });

        const totalWidth = pageWidth - 28;
        const periodColWidth = 18;
        const dayColWidth = (totalWidth - periodColWidth) / activeDays.length;
        const columnStyles: any = { 0: { cellWidth: periodColWidth } };
        activeDays.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: dayColWidth }; });

        const body: any[] = [];
        Array.from({ length: maxPeriodsCount }).forEach((_, index) => {
          const timeCell = { content: "\n\n\n\n", customData: { type: 'time', name: `P${index + 1}` } };
          const row: any[] = [timeCell];
          
          let skipCols = 0;

          activeDays.forEach((day, dIdx) => {
            if (skipCols > 0) {
              skipCols--;
              return;
            }

            const time = day === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
            if (!time) {
              row.push({ content: "\n\n\n\n", customData: { type: 'free' } });
              return;
            }

            const b = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
            if (b) {
              let colSpan = 1;
              for (let next = dIdx + 1; next < activeDays.length; next++) {
                const nextDay = activeDays[next];
                const nextTime = nextDay === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                if (nextTime) {
                  const nextB = checkBreakOverlap(nextTime, nextDay === "Saturday" ? saturdayBreaks : weekdayBreaks);
                  if (nextB && nextB.id === b.id && nextTime === time) {
                    colSpan++;
                    continue;
                  }
                }
                break;
              }

              skipCols = colSpan - 1;
              row.push({ 
                content: "\n\n\n\n", 
                colSpan, 
                customData: { type: 'break', name: b.name.toUpperCase(), time: time } 
              });
              return;
            }

            const slot = schedule[`${classData.id}-${day}-${index}`];
            if (slot && slot.type === "CLASS") {
              row.push({ content: "\n\n\n\n", customData: { type: 'slot', subject: slot.subject?.name || '', teacher: slot.teacher?.name || '', time: time } });
            } else if (slot && slot.type === "BREAK") {
              row.push({ content: "\n\n\n\n", customData: { type: 'break', name: slot.name.toUpperCase(), time: slot.customTime || time } });
            } else {
              row.push({ content: "\n\n\n\n", customData: { type: 'free' } });
            }
          });
          body.push(row);
        });
        autoTable(pdf, { head: [["Period", ...activeDays]], body, startY: startY + 10, ...tableStyles, columnStyles });
      };

      const generateTableForTeacher = (teacherData: any, startY: number = 20) => {
        pdf.setFontSize(16);
        pdf.text(`Timetable - Teacher: ${teacherData.name}`, pageWidth / 2, startY, { align: "center" });

        const totalWidth = pageWidth - 28;
        const periodColWidth = 18;
        const dayColWidth = (totalWidth - periodColWidth) / activeDays.length;
        const columnStyles: any = { 0: { cellWidth: periodColWidth } };
        activeDays.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: dayColWidth }; });

        const body: any[] = [];
        Array.from({ length: maxPeriodsCount }).forEach((_, index) => {
          const timeCell = { content: "\n\n\n\n", customData: { type: 'time', name: `P${index + 1}` } };
          const row: any[] = [timeCell];
          
          let skipCols = 0;

          activeDays.forEach((day, dIdx) => {
            if (skipCols > 0) {
              skipCols--;
              return;
            }

            const time = day === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
            if (!time) {
              row.push({ content: "\n\n\n\n", customData: { type: 'free' } });
              return;
            }

            const b = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
            if (b) {
              let colSpan = 1;
              for (let next = dIdx + 1; next < activeDays.length; next++) {
                const nextDay = activeDays[next];
                const nextTime = nextDay === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                if (nextTime) {
                  const nextB = checkBreakOverlap(nextTime, nextDay === "Saturday" ? saturdayBreaks : weekdayBreaks);
                  if (nextB && nextB.id === b.id && nextTime === time) {
                    colSpan++;
                    continue;
                  }
                }
                break;
              }

              skipCols = colSpan - 1;
              row.push({ 
                content: "\n\n\n\n", 
                colSpan, 
                customData: { type: 'break', name: b.name.toUpperCase(), time: time } 
              });
              return;
            }

            const slot = getTeacherSlot(teacherData.id, day, index);
            if (slot && slot.type === "CLASS") {
              row.push({ content: "\n\n\n\n", customData: { type: 'slot', subject: slot.subject?.name || '', teacher: `Class ${slot.classInfo?.name || ''} ${slot.classInfo?.division || ''}`, time: time } });
            } else if (slot && slot.type === "BREAK") {
              row.push({ content: "\n\n\n\n", customData: { type: 'break', name: slot.name.toUpperCase(), time: slot.customTime || time } });
            } else {
              row.push({ content: "\n\n\n\n", customData: { type: 'free' } });
            }
          });
          body.push(row);
        });
        autoTable(pdf, { head: [["Period", ...activeDays]], body, startY: startY + 10, ...tableStyles, columnStyles });
      };

      const generateTableForMaster = (day: string, startY: number = 20) => {
        pdf.setFontSize(16);
        pdf.text(`Master Timetable - ${day}`, pageWidth / 2, startY, { align: "center" });

        const totalWidth = pageWidth - 28;
        const timeColWidth = 24;
        const teacherColWidth = teachers.length > 0 ? (totalWidth - timeColWidth) / teachers.length : 0;
        const columnStyles: any = { 0: { cellWidth: timeColWidth } };
        teachers.forEach((_, i) => { columnStyles[i + 1] = { cellWidth: teacherColWidth }; });

        const body: any[] = [];
        const periodsToUse = day === "Saturday" ? saturdayPeriods : dynamicPeriods;
        
        periodsToUse.forEach((time, index) => {
          const timeCell = { content: "\n\n\n\n", customData: { type: 'time', name: time } };
          const b = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
          if (b) {
            body.push([timeCell, { 
              content: "\n\n\n\n", 
              colSpan: teachers.length, 
              customData: { type: 'break', name: b.name.toUpperCase(), time: time } 
            }]);
            return;
          }

          const row: any[] = [timeCell];
          teachers.forEach(teacher => {
            const slot = getTeacherSlot(teacher.id, day, index);
            if (slot && slot.type === "CLASS") {
              row.push({ content: "\n\n\n\n", customData: { type: 'slot', subject: slot.subject?.name || '', teacher: `Class ${slot.classInfo?.name || ''} ${slot.classInfo?.division || ''}`, time: time } });
            } else if (slot && slot.type === "BREAK") {
              row.push({ content: "\n\n\n\n", customData: { type: 'break', name: slot.name.toUpperCase(), time: slot.customTime || time } });
            } else {
              row.push({ content: "\n\n\n\n", customData: { type: 'free' } });
            }
          });
          body.push(row);
        });
        autoTable(pdf, { head: [["Time", ...teachers.map(t => t.name)]], body, startY: startY + 10, ...tableStyles, columnStyles });
      };

      let activeExportType = exportType;
      let activeEntityId = exportEntityId;

      if (exportType === "current") {
        activeExportType = viewMode;
        if (viewMode === "class") activeEntityId = selectedClass;
        if (viewMode === "teacher") activeEntityId = selectedTeacher;
      }

      if (activeExportType === "master") {
        if (teachers.length === 0) throw new Error("No teachers available");
        const daysToExport = selectedDay === "All Week" ? DAYS : [selectedDay];
        daysToExport.forEach((day, idx) => {
          if (idx > 0) pdf.addPage();
          generateTableForMaster(day, 20);
        });
      } else if (activeExportType === "all-classes") {
        if (classes.length === 0) throw new Error("No classes available");
        classes.forEach((c, idx) => {
          if (idx > 0) pdf.addPage();
          generateTableForClass(c, 20);
        });
      } else if (activeExportType === "class") {
        const c = classes.find(c => c.id === activeEntityId);
        if (!c) throw new Error("Class not found");
        generateTableForClass(c, 20);
      } else if (activeExportType === "teacher") {
        const t = teachers.find(t => t.id === activeEntityId);
        if (!t) throw new Error("Teacher not found");
        generateTableForTeacher(t, 20);
      }

      const filename = exportType === "current" 
        ? `timetable_${viewMode}.pdf` 
        : `timetable_${exportType}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error("PDF Export Error:", error);
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
    <div className="flex flex-col h-full space-y-6 print-expand">
      
      {/* Top View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
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
            <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block"></div>
            
            {isEditMode && (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear the entire timetable?")) {
                    setSchedule({});
                  }
                }}
                className="h-10 px-4 rounded-[14px] flex items-center justify-center gap-2 text-sm font-medium transition-all bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-sm"
              >
                Clear All
              </button>
            )}
            
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`h-10 px-4 rounded-[14px] flex items-center justify-center gap-2 text-sm font-medium transition-all ${isEditMode ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm' : 'bg-background hover:bg-muted/50 border border-border text-foreground'}`}
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">{isEditMode ? "Done Editing" : "Manual Edit"}</span>
            </button>

            <button 
            onClick={generateTimetable}
            disabled={isGenerating || classes.length === 0 || subjects.length === 0 || dynamicPeriods.length === 0}
            className="h-10 px-5 rounded-[14px] bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {isGenerating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {Object.keys(schedule).length > 0 ? "Regenerate AI Schedule" : "Generate Smart Schedule"}
          </button>
          
          <button 
            onClick={() => setIsExportDialogOpen(true)}
            disabled={isExporting || Object.keys(schedule).length === 0}
            className="h-10 px-5 rounded-[14px] bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all flex items-center gap-2 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {isExporting ? <RefreshCcw size={16} className="animate-spin" /> : <FileDown size={16} />}
            Export PDF
          </button>

          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-[20px]">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Export Timetable</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>What would you like to export?</Label>
                  <Select value={exportType} onValueChange={(val: any) => {
                    setExportType(val);
                    if (val === "class" && classes.length > 0) setExportEntityId(classes[0].id);
                    if (val === "teacher" && teachers.length > 0) setExportEntityId(teachers[0].id);
                  }}>
                    <SelectTrigger className="w-full rounded-[14px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current View</SelectItem>
                      <SelectItem value="master">Master Schedule (All Teachers)</SelectItem>
                      <SelectItem value="all-classes">All Classes</SelectItem>
                      <SelectItem value="class">Specific Class</SelectItem>
                      <SelectItem value="teacher">Specific Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {exportType === "class" && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <Label>Select Class</Label>
                    <Select value={exportEntityId} onValueChange={(val) => setExportEntityId(val || "")}>
                      <SelectTrigger className="w-full rounded-[14px]">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name} {c.division}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {exportType === "teacher" && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <Label>Select Teacher</Label>
                    <Select value={exportEntityId} onValueChange={(val) => setExportEntityId(val || "")}>
                      <SelectTrigger className="w-full rounded-[14px]">
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <button
                  onClick={exportToPDF}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2"
                >
                  Download PDF
                </button>
              </div>
            </DialogContent>
          </Dialog>

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
      <div className="flex flex-wrap items-end justify-between border-b border-border/50 pb-4 gap-4 no-print">
        <div className="flex flex-wrap items-center gap-4">
          
          {viewMode === "class" && (
            <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Select Class</Label>
              <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val || "")}>
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
              <Select value={selectedTeacher} onValueChange={(val) => setSelectedTeacher(val || "")}>
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
              <Select value={selectedDay} onValueChange={(val) => setSelectedDay(val || "All Week")}>
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
            <Select value={slotDuration} onValueChange={(val) => setSlotDuration(val || "")}>
              <SelectTrigger className="w-36 rounded-[14px] bg-background">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 mins</SelectItem>
                <SelectItem value="35">35 mins</SelectItem>
                <SelectItem value="40">40 mins</SelectItem>
                <SelectItem value="45">45 mins</SelectItem>
                <SelectItem value="50">50 mins</SelectItem>
                <SelectItem value="55">55 mins</SelectItem>
                <SelectItem value="60">60 mins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Adv. Options</Label>
            <button 
              onClick={() => setIsSaturdaySettingsOpen(true)}
              className="h-10 px-4 rounded-[14px] border border-border bg-background hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2"
            >
              <SlidersHorizontal size={14} /> Settings
            </button>
          </div>
          
          <Dialog open={isSaturdaySettingsOpen} onOpenChange={setIsSaturdaySettingsOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-[20px]">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Advanced Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Saturday Half-Day</Label>
                    <p className="text-sm text-muted-foreground">Include Saturday in the timetable.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isSaturdayEnabled}
                    onChange={(e) => setIsSaturdayEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
                  />
                </div>
                
                {isSaturdayEnabled && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label>Sat. Start Time</Label>
                      <input 
                        type="time" 
                        value={saturdayStartTime}
                        onChange={(e) => setSaturdayStartTime(e.target.value)}
                        className="h-10 px-3 w-full rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sat. End Time</Label>
                      <input 
                        type="time" 
                        value={saturdayEndTime}
                        onChange={(e) => setSaturdayEndTime(e.target.value)}
                        className="h-10 px-3 w-full rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setIsSaturdaySettingsOpen(false)}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mt-2"
                >
                  Done
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Slot Dialog */}
          <Dialog open={editSlotData.isOpen} onOpenChange={(open) => setEditSlotData({ ...editSlotData, isOpen: open })}>
            <DialogContent className="sm:max-w-[425px] rounded-[20px]">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Edit Slot - {editSlotData.day} {editSlotData.time}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label>Slot Type</Label>
                  <Select value={editSlotData.currentType} onValueChange={(val) => setEditSlotData({ ...editSlotData, currentType: val as "CLASS" | "FREE" | "BREAK" })}>
                    <SelectTrigger className="w-full rounded-[14px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASS">Class</SelectItem>
                      <SelectItem value="FREE">Free Period</SelectItem>
                      <SelectItem value="BREAK">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {editSlotData.currentType === "BREAK" && (
                  <>
                    <div className="space-y-2">
                      <Label>Break Name</Label>
                      <input 
                        type="text" 
                        placeholder="e.g., Lunch Break"
                        value={editSlotData.breakName || ""}
                        onChange={(e) => setEditSlotData({ ...editSlotData, breakName: e.target.value })}
                        className="h-10 px-3 w-full rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Custom Time</Label>
                      <input 
                        type="text" 
                        placeholder={`e.g., ${editSlotData.time}`}
                        value={editSlotData.customTime || ""}
                        onChange={(e) => setEditSlotData({ ...editSlotData, customTime: e.target.value })}
                        className="h-10 px-3 w-full rounded-[14px] border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  </>
                )}
                
                {editSlotData.currentType === "CLASS" && (
                  <>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={editSlotData.currentSubjectId || ""} onValueChange={(val) => setEditSlotData({ ...editSlotData, currentSubjectId: val })}>
                        <SelectTrigger className="w-full rounded-[14px]">
                          <SelectValue placeholder="Select Subject">
                            {subjects.find(s => s.id === editSlotData.currentSubjectId)?.name || "Select Subject"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {editSlotData.sourceView === "class" ? (
                      <div className="space-y-2">
                        <Label>Teacher</Label>
                        <Select value={editSlotData.currentTeacherId || ""} onValueChange={(val) => setEditSlotData({ ...editSlotData, currentTeacherId: val })}>
                          <SelectTrigger className="w-full rounded-[14px]">
                            <SelectValue placeholder="Select Teacher">
                              {teachers.find(t => t.id === editSlotData.currentTeacherId)?.name || "Select Teacher"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={editSlotData.classId || ""} onValueChange={(val) => setEditSlotData({ ...editSlotData, classId: val })}>
                          <SelectTrigger className="w-full rounded-[14px]">
                            <SelectValue placeholder="Select Class">
                              {(() => {
                                const c = classes.find(c => c.id === editSlotData.classId);
                                return c ? `${c.name} ${c.division}` : "Select Class";
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} {c.division}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
                
                {editSlotData.currentType === "CLASS" && (
                  <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg border border-border/50">
                    {(() => {
                      if (editSlotData.sourceView === "class" && editSlotData.currentTeacherId) {
                        const busySlot = Object.keys(schedule).find(key => 
                          key.endsWith(`-${editSlotData.day}-${editSlotData.index}`) && 
                          !key.startsWith(`${editSlotData.classId}-`) &&
                          schedule[key].type === "CLASS" &&
                          schedule[key].teacher?.id === editSlotData.currentTeacherId
                        );
                        if (busySlot) {
                          const busyClassId = busySlot.split('-')[0];
                          const busyClass = classes.find(c => c.id === busyClassId);
                          return <span className="text-destructive font-medium">Warning: Teacher is already assigned to Class {busyClass?.name} {busyClass?.division} at this time!</span>;
                        }
                        return "Teacher is available for this slot.";
                      } else if (editSlotData.sourceView !== "class" && editSlotData.classId) {
                        const slotKey = `${editSlotData.classId}-${editSlotData.day}-${editSlotData.index}`;
                        const existingSlot = schedule[slotKey];
                        if (existingSlot && existingSlot.type === "CLASS" && existingSlot.teacher?.id !== editSlotData.currentTeacherId) {
                          return <span className="text-destructive font-medium">Warning: Class is already assigned to Teacher {existingSlot.teacher?.name} at this time!</span>;
                        }
                        return "Class is available for this slot.";
                      }
                      return "Select options to check availability.";
                    })()}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditSlotData({ ...editSlotData, isOpen: false })}
                    className="flex-1 bg-muted text-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const newSchedule = { ...schedule };
                      
                      if (editSlotData.originalClassId && editSlotData.originalClassId !== editSlotData.classId) {
                        newSchedule[`${editSlotData.originalClassId}-${editSlotData.day}-${editSlotData.index}`] = { type: "FREE" };
                      }
                      
                      if (editSlotData.classId) {
                        const slotKey = `${editSlotData.classId}-${editSlotData.day}-${editSlotData.index}`;
                        
                        if (editSlotData.currentType === "FREE") {
                          newSchedule[slotKey] = { type: "FREE" };
                        } else if (editSlotData.currentType === "BREAK") {
                          newSchedule[slotKey] = { type: "BREAK", name: editSlotData.breakName || "Break", customTime: editSlotData.customTime };
                        } else if (editSlotData.currentType === "CLASS" && editSlotData.currentSubjectId && editSlotData.currentTeacherId) {
                          const subject = subjects.find(s => s.id === editSlotData.currentSubjectId);
                          const teacher = teachers.find(t => t.id === editSlotData.currentTeacherId);
                          const cls = classes.find(c => c.id === editSlotData.classId);
                          if (subject && teacher && cls) {
                            newSchedule[slotKey] = { type: "CLASS", subject, teacher, classInfo: cls };
                          }
                        }
                      }
                      
                      setSchedule(newSchedule);
                      setEditSlotData({ ...editSlotData, isOpen: false });
                    }}
                    className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-[14px] text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Container */}
      <div id="timetable-container" className="flex-1 overflow-auto rounded-[18px] border border-border/50 bg-background/50 relative snap-y snap-mandatory bg-white dark:bg-zinc-950 pb-8">
        {Object.keys(schedule).length === 0 && !isEditMode ? (
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
              <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, minmax(180px, 1fr))` }}>
                <div className="space-y-3">
                  <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Period</div>
                  {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                    return (
                      <div key={index} className={`h-24 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30`}>
                        P{index + 1}
                      </div>
                    )
                  })}
                </div>
                {activeDays.map(day => (
                  <div key={day} className="space-y-3">
                    <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50">{day}</div>
                    {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                      const time = day === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                      if (!time) return <div key={index} className="h-24 bg-transparent border-none"></div>;

                      const slot = schedule[`${selectedClass}-${day}-${index}`];
                      
                      if (checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks)) {
                        const b = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
                        return (
                          <div key={index} className="h-24 bg-muted/50 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden group">
                            <span className="text-[10px] font-medium text-muted-foreground mb-1">{time}</span>
                            <span className="bg-background/95 px-5 py-2 rounded-full border border-border text-foreground font-heading font-bold tracking-[0.2em] uppercase text-xs relative z-10 shadow-sm backdrop-blur-md">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      const onSlotClick = () => {
                        if (!isEditMode) return;
                        setEditSlotData({
                          isOpen: true,
                          classId: selectedClass,
                          day,
                          index,
                          time,
                          currentType: slot && slot.type !== "FREE" ? slot.type : "FREE",
                          currentSubjectId: slot?.subject?.id,
                          currentTeacherId: slot?.teacher?.id,
                          breakName: slot?.type === "BREAK" ? slot.name : "",
                          customTime: slot?.customTime || ""
                        });
                      };
                      
                      if (!slot || slot.type === "FREE") return (
                        <div key={index} onClick={onSlotClick} className={`h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground/30 text-xs ${isEditMode ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors' : ''}`}>
                          <span className="text-[10px] font-medium text-muted-foreground/50 mb-1">{time}</span>
                          {isEditMode ? <span className="text-primary/70 font-medium">Click to Edit</span> : "Empty"}
                        </div>
                      );

                      if (slot.type === "BREAK") {
                        return (
                          <div key={index} onClick={onSlotClick} className={`h-24 bg-muted/50 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden group ${isEditMode ? 'cursor-pointer hover:border hover:border-primary/50 transition-colors' : ''}`}>
                            <span className="text-[10px] font-medium text-muted-foreground mb-1">{slot.customTime || time}</span>
                            <span className="bg-background/95 px-5 py-2 rounded-full border border-border text-foreground font-heading font-bold tracking-[0.2em] uppercase text-xs relative z-10 shadow-sm backdrop-blur-md">{slot.name}</span>
                          </div>
                        )
                      }
                      
                      return (
                        <div key={index} onClick={onSlotClick} className={`h-24 bg-card hover:bg-muted/50 rounded-[14px] border border-border/80 p-3 pt-6 flex flex-col justify-between group transition-colors shadow-sm hover:shadow-md relative ${isEditMode ? 'cursor-pointer ring-1 ring-transparent hover:ring-primary/50' : 'cursor-grab'}`}>
                          <div className="absolute top-2 left-3 text-[9px] font-medium text-muted-foreground/80 flex items-center gap-1">
                            <Clock size={10} className="opacity-50" /> {time}
                          </div>
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
              <div className="grid gap-3 h-full" style={{ gridTemplateColumns: `100px repeat(${activeDays.length}, minmax(180px, 1fr))` }}>
                <div className="space-y-3">
                  <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Period</div>
                  {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                    return (
                      <div key={index} className={`h-24 flex items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30`}>
                        P{index + 1}
                      </div>
                    )
                  })}
                </div>
                {activeDays.map(day => (
                  <div key={day} className="space-y-3">
                    <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50">{day}</div>
                    {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                      const time = day === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                      if (!time) return <div key={index} className="h-24 bg-transparent border-none"></div>;

                      if (checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks)) {
                        const b = checkBreakOverlap(time, day === "Saturday" ? saturdayBreaks : weekdayBreaks);
                        return (
                          <div key={index} className="h-24 bg-muted/50 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden group">
                            <span className="text-[10px] font-medium text-muted-foreground mb-1">{time}</span>
                            <span className="bg-background/95 px-5 py-2 rounded-full border border-border text-foreground font-heading font-bold tracking-[0.2em] uppercase text-xs relative z-10 shadow-sm backdrop-blur-md">{b?.name}</span>
                          </div>
                        )
                      }
                      
                      const slot = getTeacherSlot(selectedTeacher, day, index);
                      
                      const onTeacherSlotClick = () => {
                        if (!isEditMode) return;
                        setEditSlotData({
                          isOpen: true,
                          classId: slot?.classInfo?.id || "",
                          originalClassId: slot?.classInfo?.id,
                          day,
                          index,
                          time,
                          currentType: slot && slot.type !== "FREE" ? slot.type : "FREE",
                          currentSubjectId: slot?.subject?.id,
                          currentTeacherId: selectedTeacher,
                          breakName: slot?.type === "BREAK" ? slot.name : "",
                          customTime: slot?.customTime || "",
                          sourceView: "teacher"
                        });
                      };
                      
                      if (!slot || slot.type === "FREE") return (
                        <div key={index} onClick={onTeacherSlotClick} className={`h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground/30 text-xs ${isEditMode ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors' : ''}`}>
                          <span className="text-[10px] font-medium text-muted-foreground/50 mb-1">{time}</span>
                          {isEditMode ? <span className="text-primary/70 font-medium">Click to Edit</span> : "Free"}
                        </div>
                      );

                      return (
                        <div key={index} onClick={onTeacherSlotClick} className={`h-24 bg-amber-500/10 hover:bg-amber-500/20 rounded-[14px] border border-amber-500/20 p-3 pt-6 flex flex-col justify-between group transition-colors shadow-sm hover:shadow-md relative ${isEditMode ? 'cursor-pointer ring-1 ring-transparent hover:ring-primary/50' : 'cursor-grab'}`}>
                          <div className="absolute top-2 left-3 text-[9px] font-medium text-amber-700/60 dark:text-amber-400/60 flex items-center gap-1">
                            <Clock size={10} className="opacity-50" /> {time}
                          </div>
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
                {(selectedDay === "All Week" ? activeDays : [selectedDay]).map((currentDay) => (
                  <div key={currentDay} className="flex flex-col min-h-full snap-start shrink-0 pt-2 pb-8">
                    {selectedDay === "All Week" && (
                      <h4 className="text-lg font-heading font-semibold text-foreground mb-4 pl-2 border-l-4 border-primary sticky left-0">
                        {currentDay}
                      </h4>
                    )}
                    <div className="grid gap-3" style={{ gridTemplateColumns: `100px repeat(${teachers.length}, minmax(180px, 1fr))` }}>
                      <div className="space-y-3">
                        <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-muted-foreground border-b border-border/50">Period</div>
                        {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                          const time = currentDay === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                          if (!time) return <div key={index} className="h-24 bg-transparent border-none"></div>;
                          return (
                            <div key={index} className={`h-24 flex flex-col items-center justify-center text-xs font-semibold text-muted-foreground/80 bg-muted/30 rounded-[14px] border border-border/30`}>
                              <span className="mb-1">P{index + 1}</span>
                              <span className="text-[9px] font-normal opacity-70">{time}</span>
                            </div>
                          )
                        })}
                      </div>
                      {teachers.map(teacher => (
                        <div key={teacher.id} className="space-y-3">
                          <div className="h-12 flex items-end justify-center pb-2 text-sm font-medium text-foreground border-b border-border/50 truncate px-2">
                            {teacher.name}
                          </div>
                          {Array.from({ length: maxPeriodsCount }).map((_, index) => {
                            const time = currentDay === "Saturday" ? saturdayPeriods[index] : dynamicPeriods[index];
                            if (!time) return <div key={index} className="h-24 bg-transparent border-none"></div>;

                            if (checkBreakOverlap(time, currentDay === "Saturday" ? saturdayBreaks : weekdayBreaks)) {
                              const b = checkBreakOverlap(time, currentDay === "Saturday" ? saturdayBreaks : weekdayBreaks);
                              return (
                                <div key={index} className="h-24 bg-muted/50 rounded-[14px] flex items-center justify-center relative overflow-hidden group">
                                  <span className="bg-background/95 px-5 py-2 rounded-full border border-border text-foreground font-heading font-bold tracking-[0.2em] uppercase text-xs relative z-10 shadow-sm backdrop-blur-md">{b?.name}</span>
                                </div>
                              )
                            }

                            const slot = getTeacherSlot(teacher.id, currentDay, index);
                                
                            const onMasterSlotClick = () => {
                              if (!isEditMode) return;
                              setEditSlotData({
                                isOpen: true,
                                classId: slot?.classInfo?.id || "",
                                originalClassId: slot?.classInfo?.id,
                                day: currentDay,
                                index,
                                time,
                                currentType: slot && slot.type !== "FREE" ? slot.type : "FREE",
                                currentSubjectId: slot?.subject?.id,
                                currentTeacherId: teacher.id,
                                breakName: slot?.type === "BREAK" ? slot.name : "",
                                customTime: slot?.customTime || "",
                                sourceView: "master"
                              });
                            };
                            
                            if (!slot || slot.type === "FREE") return (
                                <div key={index} onClick={onMasterSlotClick} className={`h-24 bg-card rounded-[14px] border border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground/30 text-xs ${isEditMode ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors' : ''}`}>
                                  {isEditMode ? <span className="text-primary/70 font-medium">Click to Edit</span> : "Free"}
                                </div>
                            );

                            return (
                              <div key={index} onClick={onMasterSlotClick} className={`h-24 bg-blue-500/10 hover:bg-blue-500/20 rounded-[14px] border border-blue-500/20 p-3 pt-6 flex flex-col justify-between group transition-colors shadow-sm hover:shadow-md relative ${isEditMode ? 'cursor-pointer ring-1 ring-transparent hover:ring-primary/50' : 'cursor-grab'}`}>
                                <div className="absolute top-2 left-3 text-[9px] font-medium text-blue-700/60 dark:text-blue-400/60 flex items-center gap-1">
                                  <Clock size={10} className="opacity-50" /> {time}
                                </div>
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
