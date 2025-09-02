import { Button } from "@/components/ui/button";
import { Home, Mail, MailOpen, X } from "lucide-react";
import { useMessages } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import type { Message } from "@shared/schema";

interface UserMessagesProps {
  onBack: () => void;
}

export function UserMessages({ onBack }: UserMessagesProps) {
  const { data: messages, isLoading } = useMessages();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">User Message</h1>
          <div className="w-8"></div>
        </div>

        {/* Loading Content */}
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-1 mr-2"
          >
            <Home className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
        <h1 className="text-lg font-medium text-gray-900">User Message</h1>
        <div className="w-8"></div>
      </div>

      {/* Messages Content */}
      <div className="p-4">
        {!messages || messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 mt-20">
            <div className="text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg mb-2">No Messages</div>
              <div className="text-sm">You have no messages at this time.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleMessageClick(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {message.isRead ? (
                        <MailOpen className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="font-medium text-sm text-gray-900">
                        {message.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {message.content}
                  </div>
                  {message.type && message.type !== 'General' && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {message.type}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Message Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Message Details
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDialog}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  {selectedMessage.isRead ? (
                    <MailOpen className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Mail className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="font-medium text-base text-gray-900">
                    {selectedMessage.title}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {new Date(selectedMessage.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedMessage.createdAt).toLocaleTimeString()}
                </div>
                {selectedMessage.type && selectedMessage.type !== 'General' && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {selectedMessage.type}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="default"
                  onClick={closeDialog}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}