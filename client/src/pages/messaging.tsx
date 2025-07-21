import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Key, 
  Send, 
  MessageSquare, 
  Download, 
  Copy, 
  Users, 
  Lock,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Upload
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function MessagingPage() {
  const { address, isConnected } = useWallet();
  const [messageText, setMessageText] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");

  const [demoMessages, setDemoMessages] = useState([
    {
      id: "1",
      sender: "validator1",
      content: "Network performance looking stable today",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      encrypted: false
    },
    {
      id: "2", 
      sender: "validator2",
      content: "Noticed some increased latency on Atlantic-2",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      encrypted: false
    }
  ]);

  // Generate mock encryption key for demonstration
  const generateKey = () => {
    const key = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    setEncryptionKey(key);
  };

  const exportKey = () => {
    if (!encryptionKey) {
      generateKey();
      return;
    }
    
    const keyData = {
      keyId: `mars-validator-key-${Date.now()}`,
      algorithm: "AES-256-GCM",
      key: encryptionKey,
      purpose: "validator-group-messaging",
      generated: new Date().toISOString(),
      network: "sei-testnet-atlantic-2",
    };
    
    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mars-validator-key-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyKey = () => {
    if (encryptionKey) {
      navigator.clipboard.writeText(encryptionKey);
      alert("Encryption key copied to clipboard!");
    }
  };

  const handleImportKey = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const keyData = JSON.parse(e.target?.result as string);
            if (keyData.key) {
              setEncryptionKey(keyData.key);
              alert("Key imported successfully!");
            }
          } catch (error) {
            alert("Invalid key file format");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const postDemoMessage = () => {
    if (!messageText.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      sender: address || "demo-validator",
      content: messageText,
      timestamp: new Date().toISOString(),
      encrypted: false
    };
    
    setDemoMessages(prev => [...prev, newMessage]);
    setMessageText("");
    alert("Demo message posted! This doesn't require MetaMask.");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <MessageSquare className="w-8 h-8 text-purple-accent" />
          <h1 className="text-3xl font-bold text-white">Validator Messages</h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Secure group messaging for validator coordination. Messages use end-to-end encryption
          and are revealed to stakers only during critical network events.
        </p>
      </div>

      {/* Disclaimer */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          <strong>Important:</strong> During real network events or emergencies, encrypted messages may be revealed 
          to stakers for transparency and coordination. All validator communications should follow network guidelines.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs defaultValue="key-management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-dark-card">
          <TabsTrigger value="key-management" className="data-[state=active]:bg-purple-accent text-white">
            🔑 Key Management
          </TabsTrigger>
          <TabsTrigger value="send-messages" className="data-[state=active]:bg-purple-accent text-white">
            📤 Send Messages
          </TabsTrigger>
          <TabsTrigger value="message-feed" className="data-[state=active]:bg-purple-accent text-white">
            🔒 Message Feed
          </TabsTrigger>
        </TabsList>

        {/* Key Management Tab */}
        <TabsContent value="key-management" className="space-y-6">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Cryptographic Key Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generate Keys Section */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Generate New Keys</h3>
                  <Button 
                    onClick={generateKey}
                    className="w-full bg-purple-accent hover:bg-purple-accent/90 h-12"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Generate Secure Keys
                  </Button>
                  
                  {encryptionKey && (
                    <div className="space-y-3">
                      <div className="p-3 bg-dark-bg rounded border border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">Generated Key:</div>
                        <div className="text-xs font-mono text-green-400 break-all">
                          {encryptionKey.slice(0, 32)}...
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyKey}
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={exportKey}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 p-3 bg-dark-bg rounded border border-gray-600">
                    <div className="text-sm text-gray-400 mb-1">Group Key ID</div>
                    <div className="text-sm font-mono text-white">validator-group-2025</div>
                  </div>
                </div>

                {/* Import Keys Section */}
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Import Existing Keys</h3>
                  <Textarea
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    placeholder="Paste your exported keys JSON here..."
                    rows={6}
                    className="bg-dark-bg border-gray-600 text-white font-mono text-xs resize-none"
                  />
                  <Button 
                    onClick={handleImportKey}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Keys
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Messages Tab */}
        <TabsContent value="send-messages" className="space-y-6">

          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Post Message</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message to the validator group..."
                rows={4}
                className="bg-dark-bg border-gray-600 text-white resize-none"
              />
              
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-purple-accent border-purple-accent bg-purple-accent/10 px-3 py-1">
                  <span className="text-white">{encryptionKey ? "🔒 Encrypted" : "⚠️ No Key"}</span>
                </Badge>
                
                <div className="space-x-2">
                  <Button
                    onClick={postDemoMessage}
                    disabled={!messageText.trim()}
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/10"
                  >
                    Demo Post
                  </Button>
                  <Button
                    disabled={!messageText.trim() || !encryptionKey}
                    className="bg-purple-accent hover:bg-purple-accent/90"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Send Encrypted
                  </Button>
                </div>
              </div>
              
              {/* Group Status */}
              <div className="mt-6 p-4 bg-dark-bg rounded border border-gray-600">
                <h4 className="text-white text-sm font-medium mb-3">Group Status</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-green-400 text-lg font-bold">47</div>
                    <div className="text-xs text-gray-400">Active Validators</div>
                  </div>
                  <div>
                    <div className="text-white text-lg font-bold">23</div>
                    <div className="text-xs text-gray-400">Messages Today</div>
                  </div>
                  <div>
                    <div className="text-purple-accent text-lg font-bold">100%</div>
                    <div className="text-xs text-gray-400">Encrypted</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Feed Tab */}
        <TabsContent value="message-feed" className="space-y-6">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Message Feed</span>
                </div>
                <Badge variant="outline" className="text-purple-accent border-purple-accent bg-purple-accent/10 px-3 py-1">
                  <span className="text-white">{demoMessages.length} messages</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {demoMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className="p-4 bg-dark-bg rounded-lg border border-gray-600 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-xs font-bold">
                            {message.sender.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm text-white font-medium">{message.sender}</span>
                          {message.encrypted && (
                            <Lock className="w-3 h-3 text-purple-accent" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="text-white text-sm">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}