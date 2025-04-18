import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { type ToastProps } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Save, ArrowLeft, Tag, FileEdit, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Editor } from '@/components/Editor';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SupabaseError {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

type TemplateCategory = 'contract' | 'nda' | 'agreement' | 'other';

const EditTemplate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { templates, getTemplate, updateTemplate } = useDocuments();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('other');
  const [activeTab, setActiveTab] = useState('edit');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const categories = [
    { value: 'contract' as const, label: 'Contract', color: 'bg-blue-100 text-blue-800' },
    { value: 'nda' as const, label: 'NDA', color: 'bg-purple-100 text-purple-800' },
    { value: 'agreement' as const, label: 'Agreement', color: 'bg-green-100 text-green-800' },
    { value: 'other' as const, label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      if (!id || id === 'create') {
        setIsInitializing(false);
        return;
      }

      try {
        const template = await getTemplate(id);
        if (template) {
          setTitle(template.title);
          setDescription(template.description || '');
          setContent(template.content);
          setCategory(template.category);
        }
      } catch (err) {
        console.error('Error loading template:', err);
        setError('Failed to load template');
      } finally {
        setIsInitializing(false);
      }
    };

    loadTemplate();
  }, [id, getTemplate]);

  // Handle unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const safeNavigate = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  const handleChange = (field: string, value: string) => {
    setHasUnsavedChanges(true);
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'content':
        setContent(value);
        break;
      case 'category':
        const categoryValue = value as TemplateCategory;
        if (categories.some(cat => cat.value === categoryValue)) {
          setCategory(categoryValue);
        }
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || id === 'create') return;

    setIsLoading(true);
    setError(null);
    
    try {
      await updateTemplate(id, {
        title,
        description,
        content,
        category
      });
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      safeNavigate('/templates');
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError;
      console.error('Error updating template:', error);
      setError(supabaseError?.message || 'Failed to update template');
      toast({
        variant: "destructive",
        title: "Error",
        description: supabaseError?.message || "Failed to update template"
      } as ToastProps);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-400 animate-pulse" />
                Loading template...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => safeNavigate('/templates')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </Button>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
              Unsaved Changes
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary-50">
                <FileEdit className="w-6 h-6 text-primary-600" />
              </div>
              Edit Template
            </CardTitle>
            <CardDescription>
              Modify the template details and content below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Enter template title"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
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
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter template description"
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div>
                <Label>Content</Label>
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
                              onChange={(value) => handleChange('content', value)}
                              placeholder="Enter template content..."
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
                              dangerouslySetInnerHTML={{ __html: content }}
                            />
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => safeNavigate('/templates')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !hasUnsavedChanges}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EditTemplate; 