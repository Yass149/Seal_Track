import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDocuments, type Document } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, FileText, Users, CheckCircle, XCircle, Clock, ArrowLeft, 
  Pencil, Shield, AlertCircle, Plus, AlertTriangle, Edit, Trash2, Loader2, Download 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import SignatureCanvas from '@/components/SignatureCanvas';
import { cn } from '@/lib/utils';
import { ethers } from 'ethers';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getDocument, verifyDocument, addSignature, updateDocument } = useDocuments();
  const { user } = useAuth();
  const { 
    phantomConnected, 
    connectPhantomWallet, 
    signWithPhantom,
    metamaskConnected,
    connectMetaMaskWallet,
    signWithMetaMask
  } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [addSignerDialogOpen, setAddSignerDialogOpen] = useState(false);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const document = getDocument(id || '');
  
  // Handle sign action from URL
  useEffect(() => {
    if (searchParams.get('action') === 'sign' && document && !signDialogOpen) {
      handleSign();
    }
  }, [searchParams, document]);

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

  // Check if current user is a signer
  const currentUserSigner = user ? document.signers.find(signer => 
    signer.email === user.email
  ) : null;
  
  // Check if current user has already signed
  const userHasSigned = currentUserSigner?.has_signed || false;

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

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const isAuthentic = await verifyDocument(document.id);
      
      toast({
        title: isAuthentic ? "Document Verified" : "Verification Failed",
        description: isAuthentic 
          ? "The document is authentic and has not been tampered with."
          : "The document may have been modified since it was signed.",
        variant: isAuthentic ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify the document",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleEdit = () => {
    if (document.status === 'completed') {
      toast({
        variant: "destructive",
        title: "Cannot edit",
        description: "Completed documents cannot be edited.",
      });
      return;
    }
    // Navigate to edit page
    navigate(`/documents/${document.id}/edit`);
  };

  const handleSign = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to sign documents.",
      });
      return;
    }

    if (!currentUserSigner) {
      toast({
        variant: "destructive",
        title: "Not authorized",
        description: "You are not listed as a signer for this document.",
      });
      return;
    }

    if (userHasSigned) {
      toast({
        title: "Already signed",
        description: "You have already signed this document.",
      });
      return;
    }

    // First, ensure both wallets are connected
    if (!phantomConnected) {
      try {
        await connectPhantomWallet();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Phantom Wallet required",
          description: "Please connect your Phantom wallet to sign documents.",
        });
        return;
      }
    }

    if (!metamaskConnected) {
      try {
        await connectMetaMaskWallet();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "MetaMask required",
          description: "Please connect your MetaMask wallet to verify the document.",
        });
        return;
      }
    }

    // Open signature dialog
    setSignDialogOpen(true);
  };

  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    try {
      if (!currentUserSigner) {
        throw new Error('You are not authorized to sign this document');
      }

      // Sign the document hash with Phantom
      const documentHash = await calculateDocumentHash(document);
      const signatureHash = await signWithPhantom(documentHash);

      // Store the document hash on Ethereum
      await signWithMetaMask(documentHash);

      // Add the signature to the document using the current user's signer ID
      await addSignature(document.id, currentUserSigner.id, signatureDataUrl, signatureHash);

      toast({
        title: "Document Signed",
        description: "Your signature has been successfully added to the document.",
      });

      setSignDialogOpen(false);
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        variant: "destructive",
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Failed to sign the document",
      });
    }
  };

  const handleAddSigner = () => {
    if (!newSignerName || !newSignerEmail) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please provide both name and email for the signer.",
      });
      return;
    }

    // Check if email is already in signers list
    if (document.signers.some(signer => signer.email === newSignerEmail)) {
      toast({
        variant: "destructive",
        title: "Duplicate signer",
        description: "This email is already added as a signer.",
      });
      return;
    }

    const newSigner = {
      id: crypto.randomUUID(),
      name: newSignerName,
      email: newSignerEmail,
      has_signed: false
    };

    updateDocument(document.id, {
      signers: [...document.signers, newSigner]
    });

    setNewSignerName('');
    setNewSignerEmail('');
    setAddSignerDialogOpen(false);

    toast({
      title: "Signer added",
      description: `${newSignerName} has been added as a signer.`,
    });
  };

  const totalSigners = document.signers.length;
  const signedCount = document.signers.filter(signer => signer.has_signed).length;

  const calculateDocumentHash = async (doc: Document): Promise<string> => {
    const contentToHash = JSON.stringify({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      created_at: doc.created_at,
      created_by: doc.created_by,
      signers: doc.signers.map(signer => ({
        id: signer.id,
        name: signer.name,
        email: signer.email,
        has_signed: signer.has_signed,
        signature_timestamp: signer.signature_timestamp,
        signature_hash: signer.signature_hash
      }))
    });

    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(contentToHash));
    return hash;
  };

  const handleDownloadPDF = async () => {
    if (!document || !user) return;

    try {
      setLoading(true);
      console.log('Downloading PDF for document:', {
        id: document.id,
        title: document.title,
        signerCount: document.signers.length
      });

      const { data: response, error } = await supabase.functions.invoke('generate-pdf', {
        body: { documentId: document.id }
      });

      if (error) {
        throw error;
      }

      if (!response?.data) {
        throw new Error('No PDF data received');
      }

      // Convert base64 to blob
      const binaryString = atob(response.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // Create download link using window.document
      const url = URL.createObjectURL(blob);
      const downloadLink = window.document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = response.filename || `${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      window.document.body.removeChild(downloadLink);
      
      // Clean up
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Document downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download document"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start justify-between mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="mb-4 md:mb-0">
            <Button 
              variant="ghost" 
              className="mb-4 hover:bg-gray-100 -ml-2" 
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documents
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {getStatusBadge()}
              {document.blockchain_hash && (
                <Badge className="flex items-center gap-1 bg-accent-50 text-accent-700 hover:bg-accent-100 border-accent-200">
                  <Shield className="w-3 h-3" /> Verified on Blockchain
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-2 max-w-2xl">{document.description}</p>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Button 
              variant="outline" 
              onClick={handleVerify} 
              className="w-full gap-2 hover:bg-gray-50"
              disabled={verifying || !document.blockchain_hash}
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Verify
            </Button>
            <Button 
              variant="outline" 
              onClick={handleEdit} 
              className="w-full gap-2 hover:bg-gray-50" 
              disabled={document.status === 'completed'}
            >
              <Edit className="h-4 w-4" /> Edit
            </Button>
            <Button 
              onClick={handleSign} 
              className="w-full gap-2 bg-primary-600 hover:bg-primary-700" 
              disabled={document.status === 'completed' || userHasSigned || !currentUserSigner}
            >
              {document.status === 'completed' || userHasSigned ? (
                <>
                  <CheckCircle className="h-4 w-4" /> Signed
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" /> Sign Document
                </>
              )}
            </Button>
            {document && document.signers.every(signer => signer.has_signed) && (
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={loading}
                className="w-full gap-2 hover:bg-gray-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-xl">Document Details</CardTitle>
              </CardHeader>
              <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
                <CardContent>
                  <TabsList className="mb-4 bg-gray-100 p-1">
                    <TabsTrigger 
                      value="content"
                      className="data-[state=active]:bg-white data-[state=active]:text-primary-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history"
                      className="data-[state=active]:bg-white data-[state=active]:text-primary-700"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger 
                      value="verification"
                      className="data-[state=active]:bg-white data-[state=active]:text-primary-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Verification
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-0">
                    <div 
                      className="prose max-w-none p-6 bg-gray-50 border rounded-lg min-h-[400px]"
                      dangerouslySetInnerHTML={{ 
                        __html: document.content
                      }}
                    />
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-0">
                    <div className="p-6 rounded-lg min-h-[400px]">
                      <div className="flex items-center gap-2 mb-6">
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-lg">Document Timeline</h3>
                      </div>
                      <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                          <div className="bg-blue-100 p-2 rounded-full mt-1">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Document created</p>
                            <p className="text-sm text-gray-500">
                              {new Date(document.created_at).toLocaleString()}
                            </p>
                          </div>
                        </li>
                        {document.signers.filter(signer => signer.has_signed).map((signer) => (
                          <li key={signer.id} className="flex items-start gap-4">
                            <div className="bg-green-100 p-2 rounded-full mt-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{signer.name} signed the document</p>
                              <p className="text-sm text-gray-500">
                                {signer.signature_timestamp ? new Date(signer.signature_timestamp).toLocaleString() : 'Unknown date'}
                              </p>
                              {signer.signature_hash && (
                                <p className="text-xs font-mono mt-1 text-gray-500 break-all">
                                  Hash: {signer.signature_hash}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="verification" className="mt-0">
                    <div className="p-6 rounded-lg min-h-[400px] space-y-8">
                      {/* Verification Status */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-lg">Verification Status</h3>
                        </div>
                        <div className="p-4 rounded-lg border bg-gray-50">
                          <div className="flex items-center gap-3">
                            {document.is_authentic ? (
                              <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                            ) : document.is_authentic === false ? (
                              <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="bg-gray-100 p-2 rounded-full">
                                <Shield className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {document.is_authentic
                                  ? "Document is authentic"
                                  : document.is_authentic === false
                                    ? "Document verification failed"
                                    : "Document not yet verified"}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {document.is_authentic
                                  ? `Last verified: ${document.last_verified_at 
                                      ? new Date(document.last_verified_at).toLocaleString()
                                      : 'Unknown'}`
                                  : document.is_authentic === false
                                    ? "The document may have been tampered with or corrupted."
                                    : "Click 'Verify' to check document authenticity."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document Hash */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-lg">Document Hash</h3>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                          <p className="text-sm font-mono break-all text-gray-700">
                            {document.document_hash || 'Not available'}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            This is a unique fingerprint of your document's content and metadata.
                          </p>
                        </div>
                      </div>

                      {/* Blockchain Hash */}
                      {document.blockchain_hash && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary-600" />
                            <h3 className="font-semibold text-lg">Blockchain Hash</h3>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm font-mono break-all text-gray-700">
                              {document.blockchain_hash}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              This document has been verified and stored on the blockchain.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5" /> Signers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {document.signers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 font-medium text-gray-900">No signers yet</p>
                    <p className="text-sm text-gray-500">Add signers to get started</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Signature Status</span>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {document.signers.map((signer, index) => (
                            <div
                              key={signer.id}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium",
                                signer.has_signed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                              )}
                              style={{ zIndex: document.signers.length - index }}
                            >
                              {signer.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium">
                          {signedCount}/{totalSigners}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {document.signers.map((signer) => (
                        <motion.div
                          key={signer.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-lg border bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{signer.name}</p>
                              <p className="text-sm text-gray-500">{signer.email}</p>
                              {signer.signature_timestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Signed on {new Date(signer.signature_timestamp).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div>
                              {signer.has_signed ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Signed
                                </Badge>
                              ) : signer.email === user?.email ? (
                                <Badge className="bg-primary-50 text-primary-700 border-primary-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Your signature needed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-gray-50">
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-white" 
                  onClick={() => setAddSignerDialogOpen(true)}
                  disabled={document.status === 'completed'}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Signer
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5" /> Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm font-medium">{new Date(document.created_at).toLocaleDateString()}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Category</span>
                    <span className="text-sm font-medium capitalize">{document.category || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="text-sm font-medium capitalize">{document.status}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Template</span>
                    <span className="text-sm font-medium">{document.template_id ? 'Yes' : 'No'}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add Signer Dialog */}
        <Dialog open={addSignerDialogOpen} onOpenChange={setAddSignerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Signer</DialogTitle>
              <DialogDescription>
                Add a new signer to this document. They will receive an invitation to sign.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  placeholder="Enter signer's name"
                  className="border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newSignerEmail}
                  onChange={(e) => setNewSignerEmail(e.target.value)}
                  placeholder="Enter signer's email"
                  className="border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSignerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSigner} className="bg-primary-600 hover:bg-primary-700">
                <Plus className="mr-2 h-4 w-4" /> Add Signer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Signature Dialog */}
        <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign Document</DialogTitle>
              <DialogDescription>
                Draw your signature below to sign this document.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <SignatureCanvas onSave={handleSignatureSubmit} width={400} height={200} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DocumentDetail;
