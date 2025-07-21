import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Download, Upload, Shield, Eye, EyeOff } from "lucide-react";

interface KeyManagementProps {
  onKeysGenerated: (keys: { publicKey: string; privateKey: string; groupId: string }) => void;
}

export function KeyManagement({ onKeysGenerated }: KeyManagementProps) {
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string; groupId: string } | null>(null);
  const [importedKeys, setImportedKeys] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const generateKeys = async () => {
    setIsGenerating(true);
    
    // Simulate key generation (in real app, use crypto.subtle)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newKeys = {
      publicKey: "seipub1" + Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
      privateKey: "seipriv1" + Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
      groupId: "validator-group-" + Date.now()
    };
    
    setKeys(newKeys);
    setIsGenerating(false);
    onKeysGenerated(newKeys);
  };

  const downloadKeys = () => {
    if (!keys) return;
    
    const keyData = {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
      groupId: keys.groupId,
      generated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mars2-keys-${keys.groupId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importKeys = () => {
    try {
      const imported = JSON.parse(importedKeys);
      if (imported.publicKey && imported.privateKey && imported.groupId) {
        setKeys({
          publicKey: imported.publicKey,
          privateKey: imported.privateKey,
          groupId: imported.groupId
        });
        onKeysGenerated(imported);
        setImportedKeys("");
      }
    } catch (error) {
      console.error("Invalid key format");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Key className="w-5 h-5 text-sei-blue" />
            <span>Cryptographic Key Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate New Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Generate New Keys</h3>
              <Button
                onClick={generateKeys}
                disabled={isGenerating}
                className="bg-sei-blue hover:bg-sei-blue/90 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Secure Keys"}
              </Button>
            </div>

            {keys && (
              <div className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">Generated Keys</h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600"
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={downloadKeys}
                      variant="outline"
                      size="sm"
                      className="text-gray-300 border-gray-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Group Key ID</label>
                    <div className="p-2 bg-gray-800 rounded border border-gray-600">
                      <code className="text-xs text-gray-300 break-all">{keys.groupId}</code>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Public Key</label>
                    <div className="p-2 bg-gray-800 rounded border border-gray-600">
                      <code className="text-xs text-green-400 break-all">{keys.publicKey}</code>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">Private Key</label>
                    <div className="p-2 bg-gray-800 rounded border border-gray-600">
                      <code className="text-xs text-red-400 break-all">
                        {showPrivateKey ? keys.privateKey : "•".repeat(keys.privateKey.length)}
                      </code>
                    </div>
                  </div>
                </div>

                <Alert className="border-yellow-600 bg-yellow-600/10">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-300 text-sm">
                    Keep your private key secure. Download and store it safely. You'll need it to decrypt group messages.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Import Existing Keys Section */}
          <div className="space-y-4 pt-4 border-t border-gray-600">
            <h3 className="text-lg font-semibold text-white">Import Existing Keys</h3>
            <div className="space-y-3">
              <Textarea
                value={importedKeys}
                onChange={(e) => setImportedKeys(e.target.value)}
                placeholder="Paste your exported keys JSON here..."
                className="bg-gray-900 border-gray-600 text-gray-300 placeholder-gray-500 min-h-24"
              />
              <Button
                onClick={importKeys}
                disabled={!importedKeys.trim()}
                variant="outline"
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Keys
              </Button>
            </div>
          </div>

          {/* Status */}
          {keys && (
            <div className="flex items-center space-x-2 pt-4 border-t border-gray-600">
              <Badge variant="outline" className="text-green-400 border-green-600">
                Keys Ready
              </Badge>
              <span className="text-sm text-gray-400">
                You can now send and receive encrypted messages in validator groups.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}