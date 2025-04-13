
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar } from 'lucide-react';
import { Template } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';

interface TemplateItemProps {
  template: Template;
  onUse: (templateId: string) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ template, onUse }) => {
  const navigate = useNavigate();
  
  const getCategoryBadge = () => {
    switch (template.category) {
      case 'contract':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Contract</Badge>;
      case 'nda':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">NDA</Badge>;
      case 'agreement':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Agreement</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-docuchain-primary" />
              {template.title}
            </CardTitle>
            <CardDescription className="mt-1">{template.description}</CardDescription>
          </div>
          <div>
            {getCategoryBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Created: {new Date(template.createdAt).toLocaleDateString()}
        </div>
        <div className="mt-2 text-sm line-clamp-2">
          {template.content.substring(0, 150)}...
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button variant="outline" onClick={() => navigate(`/templates/${template.id}`)}>
          Edit
        </Button>
        <Button onClick={() => onUse(template.id)}>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplateItem;
