
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateDocument = () => {
  const navigate = useNavigate();
  const { addDocument, templates, getTemplate } = useDocuments();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'contract' | 'nda' | 'agreement' | 'other'>('contract');
  const [templateId, setTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTemplateChange = (value: string) => {
    setTemplateId(value);
    if (value) {
      const template = getTemplate(value);
      if (template) {
        setTitle(template.title);
        setDescription(template.description);
        setContent(template.content);
        setCategory(template.category);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create new document
      const newDocId = addDocument({
        title,
        description,
        content,
        category,
        templateId: templateId || undefined,
        signers: [],
      });
      
      // Navigate to the documents page
      navigate('/documents');
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Document</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Use Template (Optional)</Label>
                <Select value={templateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template or start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Start from scratch</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the document"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: 'contract' | 'nda' | 'agreement' | 'other') => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select document category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Document Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the content of your document"
                  className="min-h-[300px]"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/documents')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Document'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default CreateDocument;
