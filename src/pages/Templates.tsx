import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, FileText } from 'lucide-react';
import { useDocuments, Template } from '@/context/DocumentContext';
import TemplateItem from '@/components/TemplateItem';

const Templates = () => {
  const { templates, getTemplate } = useDocuments();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  
  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleUseTemplate = (templateId: string) => {
    const template = getTemplate(templateId);
    if (template) {
      navigate('/documents/create', { state: { templateId } });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Create and manage document templates</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => navigate('/templates/create')} className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New Template
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
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
        
        {templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <FileText className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first template</p>
            <Button 
              onClick={() => navigate('/templates/create')} 
              className="mt-6"
            >
              Create Template
            </Button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Search className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No matching templates</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters</p>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateItem 
                key={template.id} 
                template={template} 
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Templates;
