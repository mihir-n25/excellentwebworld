interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification = ({ message, onClose }: NotificationProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-white hover:text-blue-200 font-bold text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
};

export default Notification;
