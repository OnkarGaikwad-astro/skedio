export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Reports & Exports</h1>
        <p className="text-muted-foreground mt-1">Generate and download timetables and workload statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-[20px] p-6 border border-border/50 shadow-sm flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg">Class Timetables</h3>
            <p className="text-sm text-muted-foreground mt-1">Export individual class schedules in PDF format.</p>
          </div>
          <button className="mt-auto bg-sidebar-primary text-sidebar-primary-foreground px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-sidebar-primary/90 transition-colors">
            Generate PDF
          </button>
        </div>

        <div className="bg-card rounded-[20px] p-6 border border-border/50 shadow-sm flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg">Teacher Workload</h3>
            <p className="text-sm text-muted-foreground mt-1">Export weekly workload analysis as an Excel spreadsheet.</p>
          </div>
          <button className="mt-auto bg-primary text-primary-foreground px-4 py-2 rounded-[12px] text-sm font-medium hover:bg-primary/90 transition-colors">
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}
