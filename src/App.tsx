import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/ThemeProvider";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <UnifiedDashboard />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
