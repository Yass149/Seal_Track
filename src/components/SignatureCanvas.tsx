
import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSave, 
  width = 500, 
  height = 200 
}) => {
  const signatureRef = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const { toast } = useToast();

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
    }
  };

  const handleSave = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      onSave(dataUrl);
      toast({
        title: "Signature saved",
        description: "Your signature has been captured successfully."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Empty signature",
        description: "Please provide a signature before saving."
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="signature-pad-container" style={{ width, height }}>
        <SignaturePad
          ref={signatureRef}
          canvasProps={{
            className: "signature-pad",
            width,
            height,
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex space-x-2 justify-end">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isEmpty}
        >
          Save Signature
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Draw your signature using your mouse or touch screen.
      </p>
    </div>
  );
};

export default SignatureCanvas;
