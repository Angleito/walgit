import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage"; // WalGit homepage
import NotFound from "./pages/NotFound";
import Repository from "./pages/Repository";
import RepositoriesList from "./pages/RepositoriesList";
import CommitDetail from "./pages/CommitDetail";
import NewRepository from "./pages/NewRepository";
import NewCommit from "./pages/NewCommit";
import OriginalHomepage from "./templates/OriginalHomepage"; // Template in templates directory

// Import Sui dApp Kit components
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';

// Create networks configuration
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') },
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider autoConnect={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} /> {/* WalGit as main homepage */}
              <Route path="/templates/original" element={<OriginalHomepage />} /> {/* Original homepage in templates */}
              <Route path="/repositories" element={<RepositoriesList />} />
              <Route path="/new" element={<NewRepository />} />
              <Route path="/:owner/:name" element={<Repository />} />
              <Route path="/:owner/:name/commits" element={<Repository />} />
              <Route path="/:owner/:name/commits/:commitId" element={<CommitDetail />} />
              <Route path="/:owner/:name/commit/new" element={<NewCommit />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
);

export default App;
