import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, MessageCircle, Brain } from 'lucide-react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validatorName: string;
  validatorAddress: string;
  initialContext?: {
    score: number;
    riskLevel: string;
    status: string;
  };
}

export function ConversationModal({ 
  isOpen, 
  onClose, 
  validatorName, 
  validatorAddress, 
  initialContext 
}: ConversationModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isOpen && !sessionId) {
      startConversation();
    }
  }, [isOpen, sessionId]);

  const startConversation = async () => {
    setIsStarting(true);
    try {
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validatorAddress,
          validatorName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your Mars² AI education assistant. I can help you understand staking concepts and analyze ${validatorName} specifically.\n\n**Quick Start Topics:**\n• "What does jailed mean?"\n• "Should I unstake from this validator?"\n• "Explain commission rates"\n• "How does redelegation work?"\n• "What's the Mars² score?"\n\nWhat would you like to learn about?`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I encountered an error starting our conversation. Please try again later.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMsg: ConversationMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add AI response
      const aiMsg: ConversationMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: ConversationMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={i} className="font-semibold text-white mb-2 mt-3">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      if (line.startsWith('• ')) {
        return (
          <div key={i} className="ml-4 mb-1 text-gray-200">
            <span className="text-purple-accent mr-2">•</span>
            {line.slice(2)}
          </div>
        );
      }
      if (line.includes('🚨') || line.includes('⚠️') || line.includes('✅')) {
        return (
          <div key={i} className="text-white font-medium p-2 bg-dark-card rounded border-l-4 border-purple-accent mb-2">
            {line}
          </div>
        );
      }
      return line ? (
        <p key={i} className="text-gray-200 mb-2 leading-relaxed">
          {line}
        </p>
      ) : (
        <br key={i} />
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-card border border-gray-700 rounded-lg max-w-4xl w-full mx-4 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-purple-accent" />
            <span className="text-white font-medium">Sei Staking Education</span>
            <Badge variant="outline" className="text-purple-accent border-purple-accent">
              {validatorName}
            </Badge>
            {initialContext && (
              <Badge 
                variant="outline" 
                className={`border-current ${
                  initialContext.riskLevel === 'green' ? 'text-validator-green' :
                  initialContext.riskLevel === 'yellow' ? 'text-validator-yellow' :
                  'text-validator-red'
                }`}
              >
                Score: {initialContext.score}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isStarting ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-accent mr-2" />
                <span className="text-gray-300">Starting conversation...</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-purple-accent text-white ml-4'
                      : 'bg-dark-bg border border-gray-600 text-gray-200 mr-4'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      {message.role === 'assistant' && <Brain className="w-4 h-4 text-purple-accent" />}
                      <span className="text-xs opacity-75">
                        {message.role === 'user' ? 'You' : 'Mars² AI'}
                      </span>
                    </div>
                    <div className={message.role === 'assistant' ? 'prose prose-invert max-w-none' : ''}>
                      {message.role === 'assistant' ? formatMessage(message.content) : message.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-bg border border-gray-600 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-accent" />
                    <span className="text-gray-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about staking terms, validator risks, or get specific advice..."
              className="flex-1 bg-dark-bg border-gray-600 text-white placeholder-gray-400"
              disabled={isLoading || isStarting}
            />
            <Button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading || isStarting}
              className="bg-purple-accent hover:bg-purple-accent/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Ask about: jailing, commissions, redelegation, unstaking, slashing, or Mars² scores
          </div>
        </div>
      </div>
    </div>
  );
}