import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, FileText, Shield, Edit } from 'lucide-react';
import { Document } from '@/context/DocumentContext';
import { useNavigate } from 'react-router-dom';

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
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Edit className="w-4 h-4 text-blue-500" />;
    }
  };
  
  const getStatusBadge = () => {
    switch (document.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Draft</Badge>;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-docuchain-primary" />
              {document.title}
            </CardTitle>
            <CardDescription className="mt-1">{document.description}</CardDescription>
          </div>
          <div className="flex items-center">
            {getStatusBadge()}
            {document.blockchain_hash && (
              <Badge className="ml-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p>Created: {new Date(document.created_at).toLocaleDateString()}</p>
              <p className="mt-1">Category: {document.category.charAt(0).toUpperCase() + document.category.slice(1)}</p>
            </div>
            <div className="text-right">
              <p>Signatures: {signedCount}/{totalSigners}</p>
              <p className="mt-1">
                Status: 
                <span className="inline-flex items-center ml-1">
                  {getStatusIcon()}
                  <span className="ml-1">
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleView}
        >
          View
        </Button>
        <Button 
          onClick={handleSign}
          disabled={document.status === 'completed'}
        >
          {document.status === 'completed' ? 'Signed' : 'Sign'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentItem;
