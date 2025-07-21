import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/Header";
import { SidebarChat } from "@/components/SidebarChat";
import Home from "@/pages/home";
import { DocsPage } from "@/pages/docs";
import { MessagingPage } from "@/pages/messaging";
import { ReportPage } from "@/pages/report";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header onChatToggle={() => setChatOpen(!chatOpen)} />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/messaging" component={MessagingPage} />
        <Route path="/report" component={ReportPage} />
        <Route path="/docs" component={DocsPage} />
        <Route component={NotFound} />
      </Switch>
      <SidebarChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
