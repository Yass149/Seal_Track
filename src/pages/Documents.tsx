import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments, Document } from '@/context/DocumentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Search, PlusCircle, Clock, CheckCircle, XCircle, 
  FileEdit, Calendar, ArrowRight, Filter, SortAsc, SortDesc, 
  Calendar as CalendarIcon, Tag, Users 
} from 'lucide-react';
import DocumentItem from '@/components/DocumentItem';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const Documents = () => {
  const { documents, templates } = useDocuments();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sortOrder === 'asc' ? -comparison : comparison;
      } else {
        const comparison = a.title.localeCompare(b.title);
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
    
    setFilteredDocuments(filtered);
  }, [documents, searchQuery, activeTab, sortBy, sortOrder, categoryFilter]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'contract', label: 'Contracts' },
    { value: 'nda', label: 'NDAs' },
    { value: 'agreement', label: 'Agreements' },
    { value: 'other', label: 'Other' }
  ];

  const getDocumentStats = () => {
    const total = documents.length;
    const completed = documents.filter(doc => doc.status === 'completed').length;
    const pending = documents.filter(doc => doc.status === 'pending').length;
    const draft = documents.filter(doc => doc.status === 'draft').length;

    return { total, completed, pending, draft };
  };

  const stats = getDocumentStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-500 mt-1">Manage and track your document signatures</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="w-3 h-3" />
                  {stats.total} Total
                </Badge>
                <Badge variant="outline" className="bg-secondary-50 text-secondary-700 gap-1">
                  <FileEdit className="w-3 h-3" />
                  {stats.draft} Drafts
                </Badge>
                <Badge variant="outline" className="bg-primary-50 text-primary-700 gap-1">
                  <Clock className="w-3 h-3" />
                  {stats.pending} Pending
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {stats.completed} Completed
                </Badge>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1 md:flex-none">
                    <FileText className="w-4 h-4 mr-2" />
                    Use Template
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px]">
                  <DropdownMenuLabel>Select Template</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {templates.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No templates available
                    </DropdownMenuItem>
                  ) : (
                    templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => navigate('/documents/create', { state: { templateId: template.id } })}
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        {template.title}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="flex-1 md:flex-none bg-primary-600 hover:bg-primary-700"
                onClick={() => navigate('/documents/create')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Document
              </Button>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-10 bg-gray-50 border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {sortBy === 'date' ? <CalendarIcon className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                    Sort by
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                    <SortAsc className="w-4 h-4 mr-2" />
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                    <SortDesc className="w-4 h-4 mr-2" />
                    Name (Z-A)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
        
        <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
            >
              All Documents
            </TabsTrigger>
            <TabsTrigger 
              value="draft"
              className="data-[state=active]:bg-secondary-50 data-[state=active]:text-secondary-700"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Drafts
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
            >
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            {filteredDocuments.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12 bg-white rounded-xl border border-gray-200"
              >
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No documents found</h3>
                <p className="text-gray-500 mt-1">
                  {searchQuery 
                    ? "No documents match your search criteria" 
                    : "Create your first document to get started"}
                </p>
                <Button 
                  className="mt-4 bg-primary-600 hover:bg-primary-700" 
                  onClick={() => navigate('/documents/create')}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <ScrollArea className="h-[calc(100vh-380px)]">
                      <motion.div className="grid grid-cols-1 gap-6">
                        {filteredDocuments.map((doc) => (
                          <DocumentItem key={doc.id} document={doc} />
                        ))}
                      </motion.div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default Documents;
