import { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
    
    // Play sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
      addNotification({
        title: 'Order Update',
        message: data.message || `Order #${data.id?.toString().slice(0, 8)} status: ${data.status}`,
        type: 'info',
        orderId: data.id
      });
    };

    const handleNewOrder = (data) => {
      addNotification({
        title: 'New Order!',
        message: `Received new order for INR ${data.total}`,
        type: 'success',
        orderId: data.id
      });
    };

    socket.on('order_status_update', handleUpdate);
    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('order_status_update', handleUpdate);
      socket.off('new_order', handleNewOrder);
    };
  }, [socket]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
