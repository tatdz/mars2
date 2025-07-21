import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, X, Bot, User } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SidebarChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarChat({ isOpen, onClose }: SidebarChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm Mars² AI, your expert assistant for Sei blockchain staking. I can help you with validator analysis, risk assessment, Mars² smart contracts, and general staking questions. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuestion: userMessage.content,
          chatHistory: newMessages.slice(-10) // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date()
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm experiencing some technical difficulties. Please try again in a moment. In the meantime, you can find comprehensive Mars² documentation and validator information in the main dashboard.",
        timestamp: new Date()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-96 h-[500px] z-50 animate-in slide-in-from-right duration-300">
      <Card className="bg-dark-card border-gray-700 h-full flex flex-col shadow-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-accent" />
              <span>Mars² AI Chat</span>
              <Badge variant="outline" className="text-purple-accent border-purple-accent text-xs">
                Llama 3
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-4 pt-0 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 mb-4 pr-2 min-h-0">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-purple-accent'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-bg text-gray-200 border border-gray-600'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 rounded-full bg-purple-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-3 rounded-lg bg-dark-bg border border-gray-600">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 space-y-2">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about validators, staking, Mars² features..."
                className="flex-1 bg-dark-bg border-gray-600 text-white placeholder-gray-400"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-purple-accent hover:bg-purple-accent/90 text-white"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Powered by Mars² AI • Real-time Sei validator data
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}