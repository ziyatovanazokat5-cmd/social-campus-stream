import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

interface NewsItem {
  id: number;
  title: string;
  text: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  postMediaContent?: string;
}

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ news, isOpen, onClose }) => {
  if (!news) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] bg-card/90 backdrop-blur-md shadow-lg rounded-xl border-0">
        {/* Title at the top */}
        <DialogHeader className="pb-4 border-b border-muted">
          <DialogTitle className="text-2xl font-bold text-primary tracking-tight">
            {news.title}
          </DialogTitle>
        </DialogHeader>
        <Card className="border-0 bg-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Media on the left */}
              <div className="lg:w-1/2 w-full space-y-4">
                {news.media && news.media.length > 0 ? (
                  news.media.map((media, index) => (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                      {media.type === 'image' ? (
                        <img
                          src={`http://localhost:9000/uploads/news-media/${media.url}`}
                          alt="News media"
                          className="w-full h-auto object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={media.url}
                          controls
                          className="w-full h-auto rounded-lg"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No media available</p>
                  </div>
                )}
              </div>
              {/* Content on the right */}
              <div className="lg:w-1/2 w-full space-y-4">
                <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {news.text}
                </p>
                {news.postMediaContent && (
                  <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {news.postMediaContent}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
