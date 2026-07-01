export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure school details and academic preferences.</p>
      </div>

      <div className="bg-card rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/50 p-8 max-w-3xl">
        <form className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-heading font-medium">School Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">School Name</label>
                <input type="text" defaultValue="Skedio International School" className="w-full h-10 px-3 rounded-[14px] bg-background border border-border focus:border-ring outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Academic Year</label>
                <input type="text" defaultValue="2026-2027" className="w-full h-10 px-3 rounded-[14px] bg-background border border-border focus:border-ring outline-none" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-xl font-heading font-medium">Timetable Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Working Days</label>
                <select className="w-full h-10 px-3 rounded-[14px] bg-background border border-border focus:border-ring outline-none">
                  <option>Monday - Friday (5 Days)</option>
                  <option>Monday - Saturday (6 Days)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Periods per Day</label>
                <select className="w-full h-10 px-3 rounded-[14px] bg-background border border-border focus:border-ring outline-none">
                  <option>7 Periods</option>
                  <option>8 Periods</option>
                  <option>9 Periods</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button type="button" className="bg-primary text-primary-foreground px-6 py-2.5 rounded-[14px] font-medium shadow-sm hover:bg-primary/90 transition-colors">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
