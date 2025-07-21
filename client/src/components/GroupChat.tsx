import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContracts } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/crypto";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Lock, Eye, Send, Info } from "lucide-react";
import { KeyManagement } from "@/components/KeyManagement";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(500, "Message too long"),
  messageType: z.string().min(1, "Please select a message type"),
});

type MessageFormData = z.infer<typeof messageSchema>;

const messageTypes = [
  { value: "general", label: "General Information" },
  { value: "warning", label: "Network Warning" },
  { value: "coordination", label: "Validator Coordination" },
  { value: "technical", label: "Technical Update" },
];

export function GroupChat() {
  const { address, isConnected } = useWallet();
  const { messages, isLoadingMessages, postMessage, revealMessage } = useContracts();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string; groupId: string } | null>(null);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message: "",
      messageType: "",
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      await postMessage.mutateAsync(data.message);
      form.reset();
      setIsPostModalOpen(false);
    } catch (error) {
      console.error("Failed to post message:", error);
    }
  };

  const handleRevealMessage = async (index: number, ciphertext: string) => {
    try {
      await revealMessage.mutateAsync({
        index,
        plaintext: "This is a revealed message placeholder",
      });
    } catch (error) {
      console.error("Failed to reveal message:", error);
    }
  };

  const messageStats = {
    total: messages.length,
    revealed: messages.filter(m => m.revealed).length,
    encrypted: messages.filter(m => !m.revealed).length,
    userMessages: messages.filter(m => m.sender.toLowerCase() === address?.toLowerCase()).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Validator Encrypted Messaging</h2>
        <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-sei-blue hover:bg-sei-dark-blue"
              disabled={!isConnected || !keys}
            >
              <Send className="w-4 h-4 mr-2" />
              Post Message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-card border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Post Encrypted Message</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-dark-bg border-gray-600 text-white resize-none"
                          placeholder="Type your message..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="messageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                            <SelectValue placeholder="Select message type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-dark-card border-gray-600">
                          {messageTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="text-white hover:bg-gray-700"
                            >
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="bg-dark-bg border-sei-blue">
                  <Lock className="h-4 w-4 text-sei-blue" />
                  <AlertDescription className="text-sm text-gray-300">
                    <div className="font-medium text-sei-blue mb-1">Encryption Details</div>
                    <ul className="space-y-1">
                      <li>• Message encrypted with AES-256</li>
                      <li>• Signed with Ed25519 for authenticity</li>
                      <li>• Stored permanently on-chain</li>
                      <li>• Revealable by authorized validators</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPostModalOpen(false)}
                    className="flex-1 border-gray-600 hover:bg-gray-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={postMessage.isPending}
                    className="flex-1 bg-sei-blue hover:bg-sei-dark-blue"
                  >
                    {postMessage.isPending ? "Posting..." : "Post Message"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="keys" className="text-gray-300 data-[state=active]:bg-sei-blue data-[state=active]:text-white">
            Key Management
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-gray-300 data-[state=active]:bg-sei-blue data-[state=active]:text-white">
            Send Messages
          </TabsTrigger>
          <TabsTrigger value="feed" className="text-gray-300 data-[state=active]:bg-sei-blue data-[state=active]:text-white">
            Message Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-6">
          <Alert className="mb-6 border-sei-blue bg-sei-blue/10">
            <Info className="h-4 w-4 text-sei-blue" />
            <AlertDescription className="text-gray-300">
              Generate or import cryptographic keys to enable secure group messaging. 
              Keys are required before you can send or decrypt validator messages.
            </AlertDescription>
          </Alert>
          <KeyManagement onKeysGenerated={setKeys} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          {!keys ? (
            <Alert className="border-yellow-600 bg-yellow-600/10">
              <Lock className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300">
                Please generate or import your cryptographic keys first in the Key Management tab.
              </AlertDescription>
            </Alert>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compose Encrypted Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-sei-blue bg-sei-blue/10">
                    <Lock className="h-4 w-4 text-sei-blue" />
                    <AlertDescription className="text-gray-300">
                      Messages will be encrypted with your generated keys before being posted to the blockchain.
                      Only validators with the appropriate permissions can decrypt and reveal messages.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-center py-8 text-gray-400">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Click the "Post Message" button above to compose and send encrypted messages.</p>
                    <p className="text-sm mt-2">Current Group ID: {keys.groupId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feed" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <MessageCircle className="w-5 h-5" />
                    <span>Message Feed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {isLoadingMessages ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="bg-dark-bg p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <Skeleton className="w-6 h-6 rounded-full" />
                                <Skeleton className="w-24 h-4" />
                              </div>
                              <Skeleton className="w-16 h-3" />
                            </div>
                            <Skeleton className="w-full h-12 mb-3" />
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-2">
                                <Skeleton className="w-16 h-6" />
                                <Skeleton className="w-20 h-6" />
                              </div>
                              <Skeleton className="w-16 h-6" />
                            </div>
                          </div>
                        ))
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet. Be the first to post!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.index}
                            className="bg-dark-bg p-4 rounded-lg border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-sei-blue rounded-full flex items-center justify-center text-xs font-bold">
                                  {message.sender.slice(2, 4)}
                                </div>
                                <span className="text-sm text-gray-300">
                                  {formatAddress(message.sender)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp * 1000).toLocaleString()}
                              </span>
                            </div>

                            {message.revealed && message.plaintext ? (
                              <div className="text-sm text-white bg-dark-surface p-3 rounded border-l-2 border-validator-green">
                                "{message.plaintext}"
                              </div>
                            ) : (
                              <div className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded">
                                [Encrypted] {message.ciphertext.slice(0, 50)}...
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-3">
                              <div className="flex space-x-2 text-xs">
                                {message.revealed ? (
                                  <Badge variant="outline" className="text-validator-green border-validator-green">
                                    Revealed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-validator-yellow border-validator-yellow">
                                    Encrypted
                                  </Badge>
                                )}
                                <Badge variant="outline" className="border-gray-600">
                                  Index: {message.index}
                                </Badge>
                              </div>
                              {!message.revealed ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevealMessage(message.index, message.ciphertext)}
                                  disabled={revealMessage.isPending || !isConnected}
                                  className="text-sei-blue hover:text-blue-300"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Reveal
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-500">Already Revealed</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Message Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Messages</span>
                    <span className="text-white">{messageStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Revealed</span>
                    <span className="text-validator-green">{messageStats.revealed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Encrypted</span>
                    <span className="text-validator-yellow">{messageStats.encrypted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Messages</span>
                    <span className="text-white">{messageStats.userMessages}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Info className="w-4 h-4" />
                    <span>Encryption Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-400 space-y-2">
                  <p>Messages are encrypted using AES-256 before posting on-chain.</p>
                  <p>Only validators with score &lt; 50 can reveal warning messages.</p>
                  <p>All messages include Ed25519 signatures for authenticity.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}