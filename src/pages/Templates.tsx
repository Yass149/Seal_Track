import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, FileText, Layout, Wand2, ArrowRight, Tag, Clock, Filter } from 'lucide-react';
import { useDocuments, Template } from '@/context/DocumentContext';
import TemplateItem from '@/components/TemplateItem';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const Templates = () => {
  const { templates, getTemplate } = useDocuments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  
  // Filter and sort templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || template.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Sort templates
    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [templates, searchTerm, categoryFilter, sortBy]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const categories = [
    { value: 'contract', label: 'Contracts', color: 'bg-blue-100 text-blue-800' },
    { value: 'nda', label: 'NDAs', color: 'bg-purple-100 text-purple-800' },
    { value: 'agreement', label: 'Agreements', color: 'bg-green-100 text-green-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Layout className="w-8 h-8 text-primary-600" />
                Templates
              </h1>
              <p className="text-gray-500 mt-1">Create and manage reusable document templates</p>
            </div>
            <Button 
              onClick={() => navigate('/templates/create')} 
              className="bg-primary-600 hover:bg-primary-700 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      All Categories
                    </span>
                  </SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className={category.color}>
                          {category.label}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={sortBy} onValueChange={(value: 'recent' | 'name') => setSortBy(value)}>
                <SelectTrigger className="bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Most Recent
                    </span>
                  </SelectItem>
                  <SelectItem value="name">
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Name
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {templates.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="max-w-md mx-auto">
                <Layout className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No templates yet</h3>
                <p className="mt-2 text-gray-500">Create your first template to streamline your document creation process.</p>
                <div className="mt-8 flex flex-col items-center gap-4">
                  <Button 
                    onClick={() => navigate('/templates/create')} 
                    className="bg-primary-600 hover:bg-primary-700 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/documents')}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Back to Documents
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : filteredTemplates.length === 0 ? (
            <motion.div 
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="max-w-md mx-auto">
                <Search className="w-16 h-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">No matching templates</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search terms or filters</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter(undefined);
                  }}
                  className="mt-6"
                >
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-8"
            >
              <Card className="p-6">
                <div className="flex items-center gap-2 text-primary-600 mb-6">
                  <Wand2 className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Templates ({filteredTemplates.length})</h2>
                </div>
                
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                    {filteredTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        variants={item}
                        className="h-full"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TemplateItem 
                          template={template} 
                          onUse={(id) => navigate(`/documents/create?template=${id}`)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {filteredTemplates.length > 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 text-center"
                >
                  <Button 
                    variant="outline" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:bg-gray-50"
                  >
                    Back to Top
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Templates;
