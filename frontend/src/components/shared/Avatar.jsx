import { getInitials, getAvatarColor } from '../../utils/helpers';

/**
 * Componente Avatar reutilizable
 * Muestra la imagen del usuario o sus iniciales con color dinámico
 */
export default function Avatar({ 
  user, 
  name, 
  size = 'md', 
  isGroup = false,
  showOnline = false,
  isOnline = false,
}) {
  const displayName = user?.fullName || name || '?';
  const avatarUrl = user?.avatarUrl;
  const initials = getInitials(displayName);
  const bgColor = getAvatarColor(displayName);

  const sizeClass = {
    xs: 'avatar-xs',
    sm: 'avatar-sm',
    md: '',
    lg: '',
  }[size] || '';

  return (
    <div className={`conv-item-avatar`}>
      <div 
        className={`avatar ${isGroup ? 'group' : ''} ${sizeClass}`}
        style={{ background: avatarUrl ? undefined : bgColor }}
        title={displayName}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} />
        ) : isGroup ? (
          '👥'
        ) : (
          initials
        )}
      </div>
      {showOnline && (
        <div className={`online-dot ${isOnline ? '' : 'offline'}`} />
      )}
    </div>
  );
}
