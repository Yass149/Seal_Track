import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DocumentProvider } from "./context/DocumentContext";
import { WalletProvider } from "./context/WalletContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Documents from "./pages/Documents";
import CreateDocument from "./pages/CreateDocument";
import DocumentDetail from "./pages/DocumentDetail";
import Templates from "./pages/Templates";
import Contacts from "./pages/Contacts";
import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Public route that redirects authenticated users
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/documents" />;
  }
  
  return <>{children}</>;
};

// App Routes with authentication
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/documents/create" element={<ProtectedRoute><CreateDocument /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WalletProvider>
          <DocumentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DocumentProvider>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
