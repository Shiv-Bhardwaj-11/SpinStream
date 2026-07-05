import { useState } from 'react';
import { useStore, Friend } from '../store/useStore';
import { playSound } from '../utils/audio';
import { UserPlus, Trophy, Activity, Loader2 } from 'lucide-react';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const Social = () => {
  const {
    friends,
    activityFeed,
    removeFriend,
    sendFriendInvite,
    user
  } = useStore();

  const [inviteName, setInviteName] = useState('');
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'weekly' | 'friends'>('friends');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      // 1. Find user by username
      const usernameRef = doc(db, 'usernames', inviteName.trim().toLowerCase());
      const usernameSnap = await getDoc(usernameRef);
      
      if (!usernameSnap.exists()) {
        setSearchError('User not found.');
        setIsSearching(false);
        return;
      }
      
      // 2. Fetch user profile
      const uid = usernameSnap.data().uid;
      
      if (uid === user.uid) {
        setSearchError("You can't add yourself!");
        setIsSearching(false);
        return;
      }
      
      if (friends.some(f => (f as any).uid === uid)) {
        setSearchError('User is already your friend.');
        setIsSearching(false);
        return;
      }

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        setSearchError('User profile not found.');
        setIsSearching(false);
        return;
      }
      
      const friendProfile = userSnap.data().user;
      
      // Guard: Firestore document exists but may not have a .user field
      if (!friendProfile || !friendProfile.name) {
        setSearchError('User profile is incomplete. Ask them to log in once to set up their profile.');
        return;
      }
      
      // 3. Add to friends list
      const newFriend: Friend = {
        id: `f-${Date.now()}`,
        uid: uid,
        name: friendProfile.name,
        avatar: friendProfile.avatar,
        xp: friendProfile.xp,
        level: friendProfile.level,
        status: 'online' // mocking online status for now
      } as any;
      
      // We will re-use sendFriendInvite for adding the friend directly
      sendFriendInvite(newFriend as any);
      
      playSound.successChime(0.4);
      alert(`Added "${friendProfile.name}" to your friends list!`);
      setInviteName('');
    } catch (err: any) {
      setSearchError('Error finding user.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };



  // Compile leaderboard scores
  const getLeaderboardData = () => {
    // Add current user to list
    const currentUserFriendObj: Friend = {
      id: 'current-user',
      name: `${user.name} (You)`,
      avatar: user.avatar,
      xp: user.xp + (user.level - 1) * 1000, // Total cumulative XP
      level: user.level,
      status: 'online'
    };

    const allScores = [...friends, currentUserFriendObj];

    if (leaderboardTab === 'friends') {
      return allScores.sort((a, b) => b.xp - a.xp);
    } else if (leaderboardTab === 'weekly') {
      // Mock weekly scores (seeded using unique formulas)
      return allScores
        .map(f => ({
          ...f,
          xp: f.id === 'current-user' ? Math.round(user.xp * 0.8) : Math.round(f.xp * (0.2 + 0.1 * f.level))
        }))
        .sort((a, b) => b.xp - a.xp);
    } else {
      // Global scores: pre-seeded high score bots
      const globalBots: Friend[] = [
        { id: 'g1', name: 'MovieMarathoner', avatar: '👨‍🚀', xp: 24500, level: 25, status: 'online' },
        { id: 'g2', name: 'NetflixNerd', avatar: '👩‍🎤', xp: 18900, level: 19, status: 'away' },
        { id: 'g3', name: 'DramaQueen', avatar: '👸', xp: 15400, level: 15, status: 'online' },
      ];
      return [...allScores, ...globalBots].sort((a, b) => b.xp - a.xp);
    }
  };

  const leaderboardScores = getLeaderboardData();

  return (
    <div className="responsive-padding">
      <div className="container" style={{ maxWidth: '950px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>Social Hub</h2>
          
        </div>

        <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
          
          {/* Left Column: Friends list & Invites */}
          <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Invite Form */}
            <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} style={{ color: 'var(--accent-primary)' }} />
                Add Friends
              </h3>
              <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
                <button type="submit" disabled={isSearching} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem', opacity: isSearching ? 0.7 : 1 }}>
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
                </button>
              </form>
              {searchError && <div style={{ color: 'var(--status-error)', fontSize: '0.8rem', marginTop: '8px' }}>{searchError}</div>}
            </div>


            {/* Friends List */}
            <div className="glass animate-fade-in glass-padding" style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Your Friends ({friends.length})</h3>
              
              {friends.length === 0 ? (
                <div style={{
                  padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem',
                  border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)'
                }}>
                  You haven't added any friends yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {friends.map(friend => (
                    <div key={friend.id} className="glass-interactive" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'rgba(30,30,35,0.5)', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Avatar with active indicator */}
                        <div style={{ position: 'relative' }}>
                          <span style={{ fontSize: '1.3rem' }}>{friend.avatar}</span>
                          <div style={{
                            position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px',
                            borderRadius: '50%',
                            background: friend.status === 'online' ? '#00ff66' : friend.status === 'away' ? '#f59e0b' : '#64748b',
                            border: '1px solid var(--bg-secondary)'
                          }} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>{friend.name}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Level {friend.level} • {friend.xp} XP
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {friend.recentWatch && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📺 {friend.recentWatch}
                          </span>
                        )}
                        <button
                          onClick={() => { playSound.clunk(0.4); removeFriend(friend.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', marginTop: '4px' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Leaderboard & Activity Feed */}
          <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Leaderboard panel */}
            <div className="glass animate-fade-in glass-padding" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} style={{ color: 'var(--status-warning)' }} />
                  Leaderboard
                </h3>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '2px', borderRadius: '8px' }}>
                  {(['friends', 'weekly', 'global'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { playSound.tick(0.3); setLeaderboardTab(tab); }}
                      style={{
                        padding: '4px 10px', fontSize: '0.72rem', fontWeight: 'bold', border: 'none', borderRadius: '6px',
                        background: leaderboardTab === tab ? 'var(--accent-primary)' : 'transparent',
                        color: leaderboardTab === tab ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leaderboard entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboardScores.map((score, index) => {
                  const isSelf = score.id === 'current-user';
                  const rank = index + 1;
                  return (
                    <div key={score.id} className="glass-interactive" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 'var(--radius-md)',
                      background: isSelf ? 'rgba(124, 58, 237, 0.15)' : 'rgba(30,30,35,0.5)',
                      border: `1px solid ${isSelf ? 'var(--border-focus)' : 'rgba(255,255,255,0.05)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '20px', fontWeight: 'bold', fontSize: '0.88rem',
                          color: rank === 1 ? '#f59e0b' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'var(--text-muted)'
                        }}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </span>
                        
                        <span style={{ fontSize: '1.2rem' }}>{score.avatar}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: isSelf ? 'bold' : 'normal' }}>
                          {score.name}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>{score.xp}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="glass animate-fade-in glass-padding" style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
                Recent Activity
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                {activityFeed.map(feed => (
                  <div key={feed.id} style={{ display: 'flex', gap: '10px', fontSize: '0.82rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>{feed.userAvatar}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        <strong>{feed.userName}</strong> {feed.action} <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{feed.targetName}</span>
                      </p>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{feed.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
