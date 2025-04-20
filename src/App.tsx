import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import { DocumentProvider } from "./context/DocumentContext";
import { WalletProvider } from "./context/WalletContext";
import { MessagesProvider } from '@/context/MessagesContext';
import { ContactsProvider } from '@/context/ContactsContext';

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Documents from "./pages/Documents";
import CreateDocument from "./pages/CreateDocument";
import DocumentDetail from "./pages/DocumentDetail";
import Templates from "./pages/Templates";
import EditTemplate from "./pages/EditTemplate";
import Contacts from "./pages/Contacts";
import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import CreateTemplate from "./pages/CreateTemplate";

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
      <Route path="/templates/create" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
      <Route path="/templates/:id" element={<ProtectedRoute><EditTemplate /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const queryClient = new QueryClient();

const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DocumentProvider>
          <MessagesProvider>
            <ContactsProvider>
              <WalletProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={router.future}>
                  <AppRoutes />
                </BrowserRouter>
              </WalletProvider>
            </ContactsProvider>
          </MessagesProvider>
        </DocumentProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
