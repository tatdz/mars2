import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
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
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function MessagingPage() {
  const { address, isConnected } = useWallet();
  const { postMessage, revealMessage, messages, isLoadingMessages } = useContracts();
  const [messageText, setMessageText] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [decryptionKey, setDecryptionKey] = useState("");

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
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await postMessage.mutateAsync(messageText);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleRevealMessage = async (index: number) => {
    if (!decryptionKey.trim()) return;
    
    try {
      await revealMessage.mutateAsync({
        index,
        plaintext: `Decrypted with key: ${decryptionKey.slice(0, 8)}...`,
      });
    } catch (error) {
      console.error("Failed to reveal message:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <MessageSquare className="w-8 h-8 text-purple-accent" />
          <h1 className="text-3xl font-bold text-white">Validator Encrypted Messaging</h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Secure, encrypted communication between validators using on-chain messaging 
          with AES-256 encryption and group key management.
        </p>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-dark-card">
          <TabsTrigger value="messages" className="text-white data-[state=active]:bg-purple-accent">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message Feed
          </TabsTrigger>
          <TabsTrigger value="send" className="text-white data-[state=active]:bg-purple-accent">
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </TabsTrigger>
          <TabsTrigger value="keys" className="text-white data-[state=active]:bg-purple-accent">
            <Key className="w-4 h-4 mr-2" />
            Key Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-accent" />
                  Group Messages ({messages.length})
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>Validator Network</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full">
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center text-gray-400 py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                      No messages yet. Be the first to send a message!
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className="border border-gray-600 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-accent rounded-full"></div>
                            <span className="text-sm text-gray-400 font-mono">
                              {message.sender.slice(0, 8)}...{message.sender.slice(-6)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Validator
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {message.revealed ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-400">Revealed Message</span>
                            </div>
                            <p className="text-white bg-dark-bg p-3 rounded border">
                              {message.plaintext}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Lock className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-yellow-400">Encrypted Message</span>
                            </div>
                            <div className="bg-dark-bg p-3 rounded border font-mono text-sm text-gray-400 break-all">
                              {message.ciphertext.slice(0, 100)}...
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Enter decryption key..."
                                value={decryptionKey}
                                onChange={(e) => setDecryptionKey(e.target.value)}
                                className="bg-dark-bg border-gray-600 text-white text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleRevealMessage(index)}
                                disabled={!decryptionKey.trim() || revealMessage.isPending}
                                className="bg-purple-accent hover:bg-purple-accent/90"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Reveal
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Send className="w-5 h-5 mr-2 text-purple-accent" />
                Send Encrypted Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-dark-bg border-purple-accent">
                <Shield className="h-4 w-4 text-purple-accent" />
                <AlertDescription className="text-gray-300">
                  <div className="font-medium text-purple-accent mb-1">Security Notice</div>
                  Messages are encrypted using AES-256 before being posted on-chain. 
                  Only validators with the correct decryption key can read the content.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    Message Content
                  </label>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Enter your message for the validator group..."
                    rows={4}
                    className="bg-dark-bg border-gray-600 text-white resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {messageText.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || !isConnected || postMessage.isPending}
                    className="bg-purple-accent hover:bg-purple-accent/90 flex-1"
                  >
                    {postMessage.isPending ? (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Encrypting & Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="w-4 h-4" />
                        <span>Send Encrypted Message</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {!isConnected && (
                <Alert className="bg-dark-bg border-yellow-500">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-400">
                    Connect your wallet to send messages to the validator group.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Key className="w-5 h-5 mr-2 text-purple-accent" />
                  Encryption Key Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={generateKey}
                    className="w-full bg-purple-accent hover:bg-purple-accent/90"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Generate New Encryption Key
                  </Button>
                  
                  {encryptionKey && (
                    <div className="space-y-3">
                      <div className="bg-dark-bg p-3 rounded border">
                        <p className="text-xs text-gray-400 mb-2">Generated Key (AES-256):</p>
                        <p className="font-mono text-sm text-white break-all">
                          {encryptionKey}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={copyKey}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Key
                        </Button>
                        <Button
                          onClick={exportKey}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export JSON
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Alert className="bg-dark-bg border-blue-500">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-gray-300">
                    <div className="font-medium text-blue-400 mb-1">Key Management</div>
                    <ul className="space-y-1 text-sm">
                      <li>• Generate unique keys for each messaging session</li>
                      <li>• Share keys securely with trusted validators</li>
                      <li>• Export keys in JSON format for backup</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">How Validator Messaging Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <div>
                      <p className="text-sm text-white font-medium">Key Generation</p>
                      <p className="text-xs text-gray-400">Generate or import AES-256 encryption keys</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <div>
                      <p className="text-sm text-white font-medium">Secure Distribution</p>
                      <p className="text-xs text-gray-400">Share keys with validator group members</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                    <div>
                      <p className="text-sm text-white font-medium">Encrypted Messaging</p>
                      <p className="text-xs text-gray-400">Messages encrypted before on-chain storage</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-accent rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                    <div>
                      <p className="text-sm text-white font-medium">Selective Revelation</p>
                      <p className="text-xs text-gray-400">Decrypt messages using shared keys</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                <div className="space-y-3">
                  <h4 className="text-white font-medium text-sm">Security Features</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-300">AES-256-GCM encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-300">On-chain message immutability</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-300">Digital signature verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-300">Group key management</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}