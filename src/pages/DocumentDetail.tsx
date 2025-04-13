
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Users, CheckCircle, XCircle, Clock, ArrowLeft, Pencil, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, verifyDocument } = useDocuments();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  
  const document = getDocument(id || '');
  
  if (!document) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-16">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Document Not Found</h2>
          <p className="mt-2 text-muted-foreground">The document you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-6" onClick={() => navigate('/documents')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Documents
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (document.status) {
      case 'completed':
        return <Badge className="flex items-center gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><Pencil className="w-3 h-3" /> Draft</Badge>;
    }
  };

  const handleVerify = () => {
    verifyDocument(document.id);
  };

  const handleEdit = () => {
    // Navigate to edit page (to be implemented later)
    toast({
      title: "Edit feature",
      description: "The edit feature will be implemented soon.",
    });
  };

  const handleSign = () => {
    // Navigate to signing page (to be implemented later)
    toast({
      title: "Signing feature",
      description: "The signing feature will be implemented soon.",
    });
  };

  const totalSigners = document.signers.length;
  const signedCount = document.signers.filter(signer => signer.hasSigned).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <Button variant="outline" className="mb-4" onClick={() => navigate('/documents')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
          </Button>
          <h1 className="text-3xl font-bold">{document.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge()}
            {document.blockchainHash && (
              <Badge className="flex items-center gap-1 bg-indigo-100 text-indigo-800">
                <Shield className="w-3 h-3" /> Verified on Blockchain
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{document.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleVerify} className="gap-2">
            <Shield className="h-4 w-4" /> Verify
          </Button>
          <Button variant="outline" onClick={handleEdit} className="gap-2" disabled={document.status === 'completed'}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button onClick={handleSign} className="gap-2" disabled={document.status === 'completed'}>
            {document.status === 'completed' ? 'Signed' : 'Sign Document'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
              <CardContent>
                <TabsList className="mb-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-0">
                  <div className="p-4 bg-gray-50 border rounded-md min-h-[400px] whitespace-pre-wrap">
                    {document.content}
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <div className="p-4 border rounded-md min-h-[400px]">
                    <p className="text-sm text-muted-foreground mb-4">Document activity history</p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Document created</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(document.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </li>
                      {document.signers.filter(signer => signer.hasSigned).map((signer) => (
                        <li key={signer.id} className="flex items-start gap-4">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{signer.name} signed the document</p>
                            <p className="text-sm text-muted-foreground">
                              {signer.signatureTimestamp ? new Date(signer.signatureTimestamp).toLocaleString() : 'Unknown date'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="verification" className="mt-0">
                  <div className="p-4 border rounded-md min-h-[400px]">
                    <p className="text-sm text-muted-foreground mb-4">Document verification information</p>
                    {document.blockchainHash ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="font-medium text-green-800">Document verified on blockchain</p>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            This document has been verified and hasn't been tampered with.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Blockchain Hash</p>
                          <p className="text-sm font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                            {document.blockchainHash}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <p className="font-medium text-amber-800">Pending verification</p>
                        </div>
                        <p className="text-sm text-amber-700 mt-1">
                          This document will be verified on the blockchain after all signers have signed.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Signers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.signers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No signers added yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Signature Status:</span>
                    <span>{signedCount}/{totalSigners} signed</span>
                  </div>
                  <ul className="space-y-3">
                    {document.signers.map((signer) => (
                      <li key={signer.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{signer.name}</p>
                          <p className="text-xs text-muted-foreground">{signer.email}</p>
                        </div>
                        {signer.hasSigned ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Signed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">Pending</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled={document.status === 'completed'}>
                <Users className="mr-2 h-4 w-4" /> Add Signers
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Document Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="capitalize">{document.category}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{document.status}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span>{document.templateId ? 'Yes' : 'No'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
