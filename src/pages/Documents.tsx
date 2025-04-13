
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, FileText, Search, Filter } from 'lucide-react';
import { useDocuments, Document } from '@/context/DocumentContext';
import DocumentItem from '@/components/DocumentItem';
import Navbar from '@/components/Navbar';

const Documents = () => {
  const { documents } = useDocuments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  
  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  // Group documents by status for tabs
  const draftDocuments = filteredDocuments.filter(doc => doc.status === 'draft');
  const pendingDocuments = filteredDocuments.filter(doc => doc.status === 'pending');
  const completedDocuments = filteredDocuments.filter(doc => doc.status === 'completed');
  const allDocuments = filteredDocuments;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">Manage and sign your documents</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => navigate('/documents/create')} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New Document
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={undefined}>All Categories</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="nda">NDAs</SelectItem>
                <SelectItem value="agreement">Agreements</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {documents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FileText className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first document</p>
            <Button 
              onClick={() => navigate('/documents/create')} 
              className="mt-6"
            >
              Create Document
            </Button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Search className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No matching documents</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter(undefined);
                setCategoryFilter(undefined);
              }}
              className="mt-6"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="relative">
                All
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{allDocuments.length}</span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="relative">
                Drafts
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{draftDocuments.length}</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{pendingDocuments.length}</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Completed
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{completedDocuments.length}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {allDocuments.map((document) => (
                <DocumentItem key={document.id} document={document} />
              ))}
            </TabsContent>
            
            <TabsContent value="draft" className="space-y-4">
              {draftDocuments.length > 0 ? (
                draftDocuments.map((document) => (
                  <DocumentItem key={document.id} document={document} />
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No draft documents found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              {pendingDocuments.length > 0 ? (
                pendingDocuments.map((document) => (
                  <DocumentItem key={document.id} document={document} />
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No pending documents found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {completedDocuments.length > 0 ? (
                completedDocuments.map((document) => (
                  <DocumentItem key={document.id} document={document} />
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-sm">
                  <p className="text-gray-500">No completed documents found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Documents;
