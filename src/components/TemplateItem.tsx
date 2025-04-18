import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Edit2, ArrowRight } from 'lucide-react';
import { Template } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TemplateItemProps {
  template: Template;
  onUse: (templateId: string) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({ template, onUse }) => {
  const navigate = useNavigate();
  
  const getCategoryBadge = () => {
    switch (template.category) {
      case 'contract':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium">Contract</Badge>;
      case 'nda':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium">NDA</Badge>;
      case 'agreement':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-medium">Agreement</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">Other</Badge>;
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 h-full flex flex-col">
        <CardHeader className="space-y-2">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <div className="p-2 rounded-lg bg-primary-50">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <span className="truncate">{template.title}</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-500 line-clamp-2">
                {template.description}
              </CardDescription>
            </div>
            <div>
              {getCategoryBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-sm text-gray-500 flex items-center mb-3">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            Created: {new Date(template.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg">
            {template.content.substring(0, 150)}...
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/templates/${template.id}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            size="sm"
            onClick={() => onUse(template.id)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Use Template
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default TemplateItem;
