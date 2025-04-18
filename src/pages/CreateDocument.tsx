import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@/components/Editor';
import { FileText, Layout, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type DocumentCategory = 'contract' | 'nda' | 'agreement' | 'other';

const CreateDocument = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { addDocument, templates, getTemplate } = useDocuments();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('contract');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('edit');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle template selection from both query params and location state
    const templateFromQuery = searchParams.get('template');
    const templateFromState = location.state?.templateId;
    const templateId = templateFromQuery || templateFromState;

    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        setTitle(template.title);
        setDescription(template.description || '');
        setContent(template.content);
        setCategory(template.category as DocumentCategory);
      } else {
        // Template not found
        toast({
          title: "Template not found",
          description: "The selected template could not be found",
          variant: "destructive",
        });
        setSelectedTemplate('');
      }
    }
  }, [location.state, searchParams, templates]);

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplate('');
      setTitle('');
      setDescription('');
      setContent('');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.title);
      setDescription(template.description || '');
      setContent(template.content);
      setCategory(template.category as DocumentCategory);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDocument({
        title,
        description,
        content,
        category,
        template_id: selectedTemplate !== 'none' ? selectedTemplate : undefined,
        signers: [],
      });
      toast({
        title: "Success",
        description: "Document created successfully",
      });
      navigate('/documents');
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create document",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: 'contract' as const, label: 'Contract', color: 'bg-blue-100 text-blue-800' },
    { value: 'nda' as const, label: 'NDA', color: 'bg-purple-100 text-purple-800' },
    { value: 'agreement' as const, label: 'Agreement', color: 'bg-green-100 text-green-800' },
    { value: 'other' as const, label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/documents')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Button>
          </div>

          <Card className="max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary-50">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                Create New Document
              </CardTitle>
              <CardDescription>
                Create a new document from scratch or use a template
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Use Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Select a template or start from scratch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Start from scratch</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              {template.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Document Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter document title"
                        className="mt-1.5"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={(value: 'contract' | 'nda' | 'agreement' | 'other') => setCategory(value)}>
                        <SelectTrigger id="category" className="mt-1.5">
                          <SelectValue placeholder="Select document category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <span className="flex items-center gap-2">
                                <Badge variant="secondary" className={cat.color}>
                                  {cat.label}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the document"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Document Content</Label>
                    <div className="mt-1.5">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="mb-4">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-0">
                          <Card>
                            <CardContent className="p-0">
                              <ScrollArea className="h-[600px]">
                                <Editor
                                  value={content}
                                  onChange={setContent}
                                  placeholder="Enter document content..."
                                />
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                        <TabsContent value="preview" className="mt-0">
                          <Card>
                            <CardContent>
                              <ScrollArea className="h-[600px]">
                                <div 
                                  className="prose max-w-none p-6" 
                                  dangerouslySetInnerHTML={{ 
                                    __html: content
                                  }}
                                />
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/documents')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Document'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateDocument;
