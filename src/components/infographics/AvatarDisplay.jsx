import PersonIcon from './PersonIcon';

export default function AvatarDisplay({ photo, avatarIcon, size = 80, color = '#fff' }) {
  if (photo) {
    return <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: avatarIcon ? Math.round(size * 0.55) : undefined,
        lineHeight: 1,
      }}
    >
      {avatarIcon || <PersonIcon color={color} />}
    </div>
  );
}
