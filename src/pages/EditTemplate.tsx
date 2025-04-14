import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { type ToastProps } from '@/components/ui/toast';

const EditTemplate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTemplate, updateTemplate } = useDocuments();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'contract' | 'nda' | 'agreement' | 'other'>('contract');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!id) return;

      try {
        setIsInitializing(true);
        const template = await getTemplate(id);
        if (template) {
          setTitle(template.title);
          setDescription(template.description || '');
          setContent(template.content);
          setCategory(template.category as 'contract' | 'nda' | 'agreement' | 'other');
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Template not found"
          } as ToastProps);
          navigate('/templates');
        }
      } catch (error) {
        console.error('Error fetching template:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load template"
        } as ToastProps);
        navigate('/templates');
      } finally {
        setIsInitializing(false);
      }
    };

    fetchTemplate();
  }, [id, getTemplate, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    try {
      await updateTemplate(id, {
        title,
        description,
        content,
        category
      });
      navigate('/templates');
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update template"
      } as ToastProps);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Loading template...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Template</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Template Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter template title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the template"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: 'contract' | 'nda' | 'agreement' | 'other') => setCategory(value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select template category" />
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
                <Label htmlFor="content">Template Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the content of your template"
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
              onClick={() => navigate('/templates')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default EditTemplate; 