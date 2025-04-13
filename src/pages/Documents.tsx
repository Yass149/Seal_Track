import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments, Document } from '@/context/DocumentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, PlusCircle, Clock, CheckCircle, XCircle, FileEdit, Calendar } from 'lucide-react';
import DocumentItem from '@/components/DocumentItem';

const Documents = () => {
  const { documents } = useDocuments();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(doc => doc.status === activeTab);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="flex items-center gap-1"><FileEdit className="w-3 h-3" /> Draft</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage your documents and track signatures</p>
        </div>
        <Button
          className="mt-4 md:mt-0"
          onClick={() => navigate('/documents/create')}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create Document
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
              <p className="text-muted-foreground">Create your first document to get started</p>
              <Button className="mt-4" onClick={() => navigate('/documents/create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="cursor-pointer" 
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <DocumentItem document={doc} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="draft" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-10">
              <FileEdit className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No drafts found</h3>
              <p className="text-muted-foreground">Create a new document to get started</p>
              <Button className="mt-4" onClick={() => navigate('/documents/create')}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="cursor-pointer" 
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <DocumentItem document={doc} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No pending documents</h3>
              <p className="text-muted-foreground">Documents awaiting signatures will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="cursor-pointer" 
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <DocumentItem document={doc} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No completed documents</h3>
              <p className="text-muted-foreground">Documents with all signatures will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="cursor-pointer" 
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <DocumentItem document={doc} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Documents;
