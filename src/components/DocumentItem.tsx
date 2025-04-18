import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, FileText, Shield, Edit, Users, ArrowRight } from 'lucide-react';
import { Document } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface DocumentItemProps {
  document: Document;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document }) => {
  const navigate = useNavigate();
  
  const getStatusIcon = () => {
    switch (document.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-primary-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Edit className="w-4 h-4 text-secondary-500" />;
    }
  };
  
  const getStatusBadge = () => {
    switch (document.status) {
      case 'completed':
        return (
          <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-secondary-50 text-secondary-700 hover:bg-secondary-100 border-secondary-200">
            <Edit className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };
  
  const totalSigners = document.signers.length;
  const signedCount = document.signers.filter(signer => signer.has_signed).length;
  
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/documents/${document.id}`);
  };

  const handleSign = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/documents/${document.id}?action=sign`);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-primary-200">
        <CardHeader className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <div className="p-2 rounded-lg bg-primary-50 text-primary-500">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="truncate">{document.title}</span>
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{document.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {document.blockchain_hash && (
                <Badge className="bg-accent-50 text-accent-700 hover:bg-accent-100 border-accent-200">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                {new Date(document.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-500">
                <FileText className="w-4 h-4 mr-2" />
                {document.category.charAt(0).toUpperCase() + document.category.slice(1)}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-end text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                <span className="font-medium">{signedCount}</span>
                <span className="mx-1">/</span>
                <span>{totalSigners} signers</span>
              </div>
              <div className="flex items-center justify-end text-gray-500">
                {getStatusIcon()}
                <span className="ml-2">
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={handleView}
            className="hover:bg-gray-50"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
          </Button>
          <Button 
            onClick={handleSign}
            disabled={document.status === 'completed'}
            className={document.status === 'completed' 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-primary-600 hover:bg-primary-700'
            }
          >
            {document.status === 'completed' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Signed
              </>
            ) : (
              'Sign Now'
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default DocumentItem;
