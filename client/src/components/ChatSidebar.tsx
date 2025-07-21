import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Minimize2,
  Maximize2,
  Loader2
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ChatSidebar() {
  const { address } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          walletAddress: address 
        })
      });

      if (response.ok) {
        const session = await response.json();
        setMessages(session.messages || []);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          walletAddress: address
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const aiMessage = await response.json();
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const formatMessage = (content: string) => {
    // Convert markdown-style formatting to JSX
    return content.split('\n').map((line, i) => {
      if (line.startsWith('• ')) {
        return (
          <div key={i} className="ml-4 mb-1">
            <span className="text-purple-accent mr-2">•</span>
            {line.slice(2)}
          </div>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <div key={i} className="ml-4 mb-1">
            <span className="text-purple-accent font-medium">{line}</span>
          </div>
        );
      }
      if (line.includes('**') && line.includes('**')) {
        const parts = line.split('**');
        return (
          <div key={i} className="mb-1">
            {parts.map((part, j) => 
              j % 2 === 1 ? (
                <span key={j} className="font-medium text-white">{part}</span>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </div>
        );
      }
      return line ? <div key={i} className="mb-1">{line}</div> : <div key={i} className="mb-1">&nbsp;</div>;
    });
  };

  // Floating chat button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-purple-accent hover:bg-purple-accent/90 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] z-50">
      <Card className="h-full bg-dark-card border-gray-700 shadow-xl">
        <CardHeader className="pb-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-accent" />
              <CardTitle className="text-white text-base">Mars² AI Assistant</CardTitle>
              <Badge variant="outline" className="text-xs border-purple-accent text-purple-accent">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {address && (
            <div className="text-xs text-gray-400 mt-1">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-purple-accent text-white'
                          : 'bg-dark-bg border border-gray-600 text-gray-100'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className="w-4 h-4 text-purple-accent mt-1 flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="w-4 h-4 text-white mt-1 flex-shrink-0" />
                        )}
                        <div className="text-sm leading-relaxed">
                          {formatMessage(message.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-bg border border-gray-600 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-purple-accent" />
                        <Loader2 className="w-4 h-4 animate-spin text-purple-accent" />
                        <span className="text-sm text-gray-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-gray-700 p-4">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about staking, validators, or risks..."
                  className="flex-1 bg-dark-bg border-gray-600 text-white placeholder:text-gray-400"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  size="sm"
                  className="bg-purple-accent hover:bg-purple-accent/90 px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Try: "Should I unstake from RHINO?" or "Who are the safest validators?"
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}