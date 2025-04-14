import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDocuments } from '@/context/DocumentContext';
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
  Pencil, Shield, AlertCircle, Plus 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import SignatureCanvas from '@/components/SignatureCanvas';

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getDocument, verifyDocument, addSignature, updateDocument } = useDocuments();
  const { user } = useAuth();
  const { connected, connectWallet, signMessage } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [addSignerDialogOpen, setAddSignerDialogOpen] = useState(false);
  const [newSignerName, setNewSignerName] = useState('');
  const [newSignerEmail, setNewSignerEmail] = useState('');
  
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
    if (!document.blockchain_hash) {
      toast({
        variant: "destructive",
        title: "Not verified",
        description: "This document has not been signed and verified on the blockchain yet.",
      });
      return;
    }

    setVerifying(true);
    try {
      const isVerified = await verifyDocument(document.id);
      if (isVerified) {
        toast({
          title: "Document verified",
          description: "The document's authenticity has been verified on the blockchain.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: "Could not verify the document's authenticity.",
        });
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        variant: "destructive",
        title: "Verification error",
        description: "An error occurred while verifying the document.",
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

    // First, ensure wallet is connected
    if (!connected) {
      try {
        await connectWallet();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Wallet connection required",
          description: "Please connect your Phantom wallet to sign documents.",
        });
        return;
      }
    }

    // Open signature dialog
    setSignDialogOpen(true);
  };

  const handleSaveSignature = async (signatureDataUrl: string) => {
    try {
      if (!user || !currentUserSigner) return;
      
      // Sign message with Phantom wallet
      let signatureHash = "";
      try {
        const messageToSign = JSON.stringify({
          action: "sign_document",
          document_id: document.id,
          signer_id: currentUserSigner.id,
          timestamp: new Date().toISOString()
        });
        
        signatureHash = await signMessage(messageToSign);
      } catch (error) {
        console.error("Wallet signing error:", error);
        toast({
          variant: "destructive",
          title: "Signing error",
          description: "Error while signing with Phantom wallet. Please try again.",
        });
        return;
      }
      
      // Add signature to the document with blockchain hash
      addSignature(document.id, currentUserSigner.id, signatureDataUrl, signatureHash);
      
      setSignDialogOpen(false);
      
      toast({
        title: "Document signed successfully",
        description: "Your signature has been added and verified on the blockchain.",
      });

      // Redirect to documents page after successful signing
      navigate('/documents');
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({
        variant: "destructive",
        title: "Signature error",
        description: "An error occurred while saving your signature.",
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
            {document.blockchain_hash && (
              <Badge className="flex items-center gap-1 bg-indigo-100 text-indigo-800">
                <Shield className="w-3 h-3" /> Verified on Blockchain
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{document.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            onClick={handleVerify} 
            className="gap-2"
            disabled={verifying || !document.blockchain_hash}
          >
            {verifying ? <span className="animate-spin mr-2">●</span> : <Shield className="h-4 w-4" />}
            Verify
          </Button>
          <Button 
            variant="outline" 
            onClick={handleEdit} 
            className="gap-2" 
            disabled={document.status === 'completed'}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button 
            onClick={handleSign} 
            className="gap-2" 
            disabled={document.status === 'completed' || userHasSigned || !currentUserSigner}
          >
            {document.status === 'completed' || userHasSigned ? 'Signed' : 'Sign Document'}
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
                            {new Date(document.created_at).toLocaleString()}
                          </p>
                        </div>
                      </li>
                      {document.signers.filter(signer => signer.has_signed).map((signer) => (
                        <li key={signer.id} className="flex items-start gap-4">
                          <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{signer.name} signed the document</p>
                            <p className="text-sm text-muted-foreground">
                              {signer.signature_timestamp ? new Date(signer.signature_timestamp).toLocaleString() : 'Unknown date'}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="verification" className="mt-0">
                  <div className="p-4 border rounded-md min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">Blockchain verification status</p>
                      <Button 
                        variant="outline" 
                        onClick={handleVerify}
                        disabled={verifying || !document.blockchain_hash}
                        className="gap-2"
                      >
                        {verifying ? (
                          <span className="animate-spin mr-2">●</span>
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        Verify Now
                      </Button>
                    </div>
                    {document.blockchain_hash ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-green-700">
                            <Shield className="h-5 w-5" />
                            <p className="font-medium">Document is verified on the blockchain</p>
                          </div>
                          <p className="mt-2 text-sm text-green-600">
                            This document has been signed and its integrity is verified on the blockchain.
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Blockchain Hash</p>
                          <p className="text-sm font-mono bg-gray-50 p-2 rounded border break-all">
                            {document.blockchain_hash}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertCircle className="h-5 w-5" />
                          <p className="font-medium">Document not yet verified</p>
                        </div>
                        <p className="mt-2 text-sm text-amber-600">
                          This document will be verified on the blockchain once all signers have signed.
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
                          {signer.signature_timestamp && (
                            <p className="text-xs text-muted-foreground">
                              Signed on {new Date(signer.signature_timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {signer.has_signed ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Signed
                            </Badge>
                          ) : signer.email === user?.email ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Your signature needed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setAddSignerDialogOpen(true)}
                disabled={document.status === 'completed'}
              >
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
                  <span>{new Date(document.created_at).toLocaleDateString()}</span>
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
                  <span>{document.template_id ? 'Yes' : 'No'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSignerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSigner}>
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
            <SignatureCanvas onSave={handleSaveSignature} width={400} height={200} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentDetail;
