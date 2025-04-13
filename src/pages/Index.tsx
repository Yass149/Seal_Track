
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, FileText, Check, Users, Wallet } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-docuchain-primary to-docuchain-secondary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Secure Document Signing with Blockchain Technology
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            Sign documents securely using your Phantom wallet and verify authenticity with blockchain validation.
          </p>
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <Button 
              size="lg" 
              className="bg-white text-docuchain-primary hover:bg-gray-100"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/20"
              onClick={() => navigate('/documents')}
            >
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-docuchain-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-docuchain-text">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-docuchain-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-docuchain-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Blockchain Signing</h3>
                <p className="text-gray-600">
                  Sign documents securely using your Phantom wallet on the Solana blockchain.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-docuchain-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-docuchain-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Tamper-Proof Verification</h3>
                <p className="text-gray-600">
                  Ensure your documents are authentic with blockchain-backed verification.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contract Templates</h3>
                <p className="text-gray-600">
                  Create and customize contract templates for NDAs, agreements, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-docuchain-text">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-docuchain-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-docuchain-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Document</h3>
              <p className="text-gray-600">
                Draft a document or use one of our templates
              </p>
            </div>
            <div className="text-center">
              <div className="bg-docuchain-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-docuchain-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Add Signers</h3>
              <p className="text-gray-600">
                Invite parties who need to sign the document
              </p>
            </div>
            <div className="text-center">
              <div className="bg-docuchain-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-docuchain-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Blockchain Signing</h3>
              <p className="text-gray-600">
                Sign using your Phantom wallet
              </p>
            </div>
            <div className="text-center">
              <div className="bg-docuchain-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-docuchain-primary">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verified Forever</h3>
              <p className="text-gray-600">
                Document is verified and secured on the blockchain
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-docuchain-primary/5 to-docuchain-secondary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-docuchain-text">
            Why Choose DocuChain?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <Check className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Enhanced Security</h3>
                <p className="text-gray-600">
                  Blockchain technology ensures your documents can't be tampered with or forged.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Global Accessibility</h3>
                <p className="text-gray-600">
                  Sign documents from anywhere in the world without geographical limitations.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Time Efficiency</h3>
                <p className="text-gray-600">
                  Streamlined process reduces document turnaround time from days to minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-6 h-6 text-green-500 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Cost Effective</h3>
                <p className="text-gray-600">
                  Save on legal fees and administrative costs with our digital solution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-docuchain-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust DocuChain for their secure document signing needs.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-docuchain-primary hover:bg-gray-100"
            onClick={() => navigate('/signup')}
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <svg
                  className="w-8 h-8 mr-2 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  <path d="M6.75 5.25h10.5a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z" />
                </svg>
                <span className="text-xl font-semibold">DocuChain</span>
              </div>
              <p className="text-gray-400 mt-2">Secure document signing with blockchain</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Contact Us
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} DocuChain. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
