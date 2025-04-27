import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import Repository from "./pages/Repository";
import RepositoriesList from "./pages/RepositoriesList";
import CommitDetail from "./pages/CommitDetail";
import NewRepository from "./pages/NewRepository";
import NewCommit from "./pages/NewCommit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/repositories" element={<RepositoriesList />} />
        <Route path="/new" element={<NewRepository />} />
        <Route path="/:owner/:name" element={<Repository />} />
        <Route path="/:owner/:name/commits" element={<Repository />} />
        <Route path="/:owner/:name/commits/:commitId" element={<CommitDetail />} />
        <Route path="/:owner/:name/commit/new" element={<NewCommit />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
