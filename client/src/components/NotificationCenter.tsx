import { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  XCircle, 
  Trash2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { AITranslatedText } from './AITranslatedText';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguageContext();
  const t_i18n = (messages as Record<string, any>)[language] || messages.en;
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-slate-400 hover:text-white hover:bg-slate-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900" />
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <Card className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border-slate-800 shadow-2xl shadow-black/50 z-50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {t_i18n.common.notifications || 'Notifications'}
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[10px] font-bold">
                    {unreadCount} NEW
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[11px] text-slate-400 hover:text-white"
                  onClick={markAllAsRead}
                >
                  {t_i18n.common.markAllRead || 'Mark all read'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-[11px] text-slate-400 hover:text-red-400"
                  onClick={clearAll}
                >
                  {t_i18n.common.clearAll || 'Clear all'}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-slate-500">{t_i18n.common.noNotifications || 'No notifications yet'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((n) => (
                    <div 
                      key={n.id}
                      className={`p-4 hover:bg-slate-800/30 transition-colors relative group ${!n.read ? 'bg-cyan-500/[0.02]' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 flex-shrink-0">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <AITranslatedText 
                              text={n.title} 
                              as="p" 
                              className={`text-sm font-medium leading-none mb-1 ${!n.read ? 'text-white' : 'text-slate-300'}`} 
                            />
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {formatDistanceToNow(n.timestamp)} ago
                            </span>
                          </div>
                          <AITranslatedText 
                            text={n.message} 
                            as="p" 
                            className="text-xs text-slate-500 line-clamp-2 leading-relaxed" 
                          />
                          
                          {n.link && (
                            <Link href={n.link}>
                              <a 
                                className="mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                onClick={() => markAsRead(n.id)}
                              >
                                View details
                                <ChevronRight className="w-3 h-3" />
                              </a>
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.read && (
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500" 
                          onClick={() => markAsRead(n.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  className="w-full h-8 text-xs bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  {t_i18n.common.close || 'Close'}
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
