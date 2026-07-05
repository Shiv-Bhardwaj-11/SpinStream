import { create } from 'zustand';
import { MovieItem } from '../data/movies';
import { fetchFromTMDB } from '../utils/tmdb';
import { db, auth } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export interface UserProfile {
  uid?: string;
  email?: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  lastSpinDate: string | null;
  lastWatchDate: string | null;
  lastVisitDate: string | null;
  favoriteGenres: string[];
}

export interface WatchedHistoryItem {
  id: string;
  movie: MovieItem;
  watchedAt: string;
  userRating?: number;
}

export interface Friend {
  id: string;
  uid?: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  recentWatch?: string;
  status: 'online' | 'offline' | 'away';
}

export interface FriendInvite {
  id: string;
  senderName: string;
  senderAvatar: string;
}

export interface ActivityFeedItem {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetName: string;
  timestamp: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetXP: number;
  unlockedAt: string | null;
}

export interface AppState {
  currentView: 'landing' | 'slot' | 'dashboard' | 'social' | 'achievements';
  isAuthenticated: boolean;
  user: UserProfile;
  watchedHistory: WatchedHistoryItem[];
  excludedIds: string[];
  friends: Friend[];
  invites: FriendInvite[];
  activityFeed: ActivityFeedItem[];
  achievements: Achievement[];
  badgeNotifications: Achievement[];
  settings: {
    soundVolume: number;
    animationSpeed: 'normal' | 'fast' | 'slow';
    tmdbApiKey: string;
  };
  spinStats: {
    totalSpins: number;
    spinsThisSession: number;
  };
  weeklyChallenge: {
    title: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
  };

  // Actions
  setView: (view: AppState['currentView']) => void;
  loginUser: (stateData: any) => void;
  logout: () => void;
  recordVisit: () => void;
  addXP: (amount: number) => void;
  addToHistory: (movie: MovieItem, rating?: number) => void;
  excludeMovie: (movieId: string) => void;
  removeExcludeMovie: (movieId: string) => void;
  spin: (filters: { genre: string; type: string }) => Promise<MovieItem | null>;
  sendFriendInvite: (friendObj: any) => void;
  acceptInvite: (inviteId: string) => void;
  declineInvite: (inviteId: string) => void;
  removeFriend: (friendId: string) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  updateUsername: (newName: string) => void;
  dismissBadgeNotification: (id: string) => void;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-first', title: 'First Spin', description: 'Spin the slot machine for the first time', icon: '🎡', targetXP: 100, unlockedAt: null },
  { id: 'ach-watch-1', title: 'First Drop', description: 'Mark your first recommendation as Watched', icon: '🎬', targetXP: 150, unlockedAt: null },
  { id: 'ach-streak-3', title: 'Streak Starter', description: 'Log a watch 3 days in a row', icon: '🔥', targetXP: 300, unlockedAt: null },
  { id: 'ach-otaku', title: 'Otaku', description: 'Mark 3 Anime titles as watched', icon: '🎌', targetXP: 250, unlockedAt: null },
  { id: 'ach-kdrama', title: 'K-Wave Fan', description: 'Mark 3 K-Dramas as watched', icon: '🍜', targetXP: 250, unlockedAt: null },
  { id: 'ach-binge', title: 'Binge Lord', description: 'Log 5 items of any type to your history', icon: '👑', targetXP: 500, unlockedAt: null },
  { id: 'ach-action', title: 'Action Hero', description: 'Mark 3 Action titles as watched', icon: '💥', targetXP: 250, unlockedAt: null },
  { id: 'ach-comedy', title: 'Comedy Gold', description: 'Mark 3 Comedy titles as watched', icon: '😂', targetXP: 250, unlockedAt: null },
  { id: 'ach-horror', title: 'Horror Buff', description: 'Mark 3 Horror titles as watched', icon: '👻', targetXP: 250, unlockedAt: null },
  { id: 'ach-scifi', title: 'Sci-Fi Explorer', description: 'Mark 3 Sci-Fi titles as watched', icon: '👽', targetXP: 250, unlockedAt: null },
  { id: 'ach-spinnaholic', title: 'Spinnaholic', description: 'Spin the slot machine 10 times', icon: '🎰', targetXP: 300, unlockedAt: null },
  { id: 'ach-cinephile', title: 'Cinephile', description: 'Log 10 items of any type to your history', icon: '🏆', targetXP: 600, unlockedAt: null },
  { id: 'ach-social', title: 'Social Butterfly', description: 'Add your first friend', icon: '🦋', targetXP: 300, unlockedAt: null },
  { id: 'ach-picky', title: 'Picky Eater', description: 'Exclude your first movie from recommendations', icon: '🙅', targetXP: 100, unlockedAt: null },
  { id: 'ach-critic', title: 'Top Critic', description: 'Give a star rating to 3 movies', icon: '⭐', targetXP: 300, unlockedAt: null },
  { id: 'ach-weekend', title: 'Weekend Warrior', description: 'Log a watch on a Saturday or Sunday', icon: '🎮', targetXP: 200, unlockedAt: null }
];

// Helper to load state from localStorage
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem('spinstream_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-hydrate components that might have changed
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved state:', e);
  }
  return null;
};

const savedState = loadSavedState();

const mergeAchievements = (saved: any[]) => {
  if (!saved || saved.length === 0) return INITIAL_ACHIEVEMENTS;
  return INITIAL_ACHIEVEMENTS.map(initial => {
    const found = saved.find(s => s.id === initial.id);
    return found ? { ...initial, unlockedAt: found.unlockedAt } : initial;
  });
};

// Purge legacy fake friends and their activity from saved state
const legacyFriendIds = ['f1', 'f2', 'f3', 'f4'];
const legacyFriendNames = ['Cinephile_Sarah', 'AnimeKing99', 'K_Drama_Fanatic', 'DocuExplorer'];
const cleanFriends = (savedState?.friends || []).filter((f: any) => !legacyFriendIds.includes(f.id));
const cleanFeed = (savedState?.activityFeed || []).filter((f: any) => {
  const isOldMockFeed = ['feed-1', 'feed-2', 'feed-3'].includes(f.id);
  const isFromLegacyFriend = legacyFriendNames.includes(f.userName);
  return !isOldMockFeed && !isFromLegacyFriend;
});


export const useStore = create<AppState>((set, get) => {
  const saveState = (newState: Partial<AppState>) => {
    const current = get();
    const merged = {
      isAuthenticated: current.isAuthenticated,
      user: current.user,
      watchedHistory: current.watchedHistory,
      excludedIds: current.excludedIds,
      friends: current.friends,
      invites: current.invites,
      activityFeed: current.activityFeed,
      achievements: current.achievements,
      badgeNotifications: current.badgeNotifications,
      settings: current.settings,
      spinStats: current.spinStats,
      weeklyChallenge: current.weeklyChallenge,
      ...newState
    };
    try {
      localStorage.setItem('spinstream_state', JSON.stringify(merged));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
    
    // Sync to Firestore if authenticated
    if (merged.isAuthenticated && merged.user?.uid) {
      try {
        updateDoc(doc(db, 'users', merged.user.uid), {
          user: merged.user,
          watchedHistory: merged.watchedHistory,
          excludedIds: merged.excludedIds,
          friends: merged.friends,
          achievements: merged.achievements,
          spinStats: merged.spinStats,
          weeklyChallenge: merged.weeklyChallenge
        }).catch(err => console.error('Firestore sync error:', err));
      } catch (err) {
        console.error('Firestore validation error:', err);
      }
    }
  };

  return {
    currentView: 'landing',
    isAuthenticated: savedState?.isAuthenticated ?? false,
    user: savedState?.user ?? {
      name: 'Guest Spinner',
      avatar: '🦊',
      xp: 0,
      level: 1,
      streak: 0,
      lastSpinDate: null,
      lastWatchDate: null,
      lastVisitDate: null,
      favoriteGenres: []
    },
    watchedHistory: savedState?.watchedHistory ?? [],
    excludedIds: savedState?.excludedIds ?? [],
    friends: cleanFriends,
    invites: savedState?.invites ?? [],
    activityFeed: cleanFeed,
    achievements: mergeAchievements(savedState?.achievements),
    badgeNotifications: [],
    settings: savedState?.settings ?? {
      soundVolume: 0.5,
      animationSpeed: 'normal',
      tmdbApiKey: ''
    },
    spinStats: savedState?.spinStats ?? {
      totalSpins: 0,
      spinsThisSession: 0
    },
    weeklyChallenge: savedState?.weeklyChallenge ?? {
      title: "Weekend Marathon",
      description: "Watch 3 Movies or TV Series",
      progress: 0,
      target: 3,
      xpReward: 400
    },

    setView: (view) => set({ currentView: view }),

    loginUser: (stateData) => {
      const newState = {
        isAuthenticated: true,
        user: stateData.user,
        watchedHistory: stateData.watchedHistory || [],
        excludedIds: stateData.excludedIds || [],
        friends: stateData.friends || [],
        achievements: mergeAchievements(stateData.achievements),
        spinStats: stateData.spinStats || { totalSpins: 0, spinsThisSession: 0 },
        weeklyChallenge: stateData.weeklyChallenge || get().weeklyChallenge
      };
      set(newState);
      saveState(newState);
    },

    updateUsername: (newName) => {
      const { user } = get();
      if (!newName.trim()) return;
      const updatedUser = { ...user, name: newName.trim() };
      set({ user: updatedUser });
      saveState({ user: updatedUser });
    },

    logout: () => {
      const guestProfile = {
        name: 'Guest Spinner',
        avatar: '🦊',
        xp: 0,
        level: 1,
        streak: 0,
        lastSpinDate: null,
        lastWatchDate: null,
        lastVisitDate: null,
        favoriteGenres: []
      };
      // Reset ALL state so previous user's data never leaks to next session
      set({
        isAuthenticated: false,
        user: guestProfile,
        watchedHistory: [],
        excludedIds: [],
        friends: [],
        invites: [],
        activityFeed: [],
        achievements: INITIAL_ACHIEVEMENTS,
        badgeNotifications: [],
        spinStats: { totalSpins: 0, spinsThisSession: 0 },
        weeklyChallenge: {
          title: 'Weekend Marathon',
          description: 'Watch 3 Movies or TV Series',
          progress: 0,
          target: 3,
          xpReward: 400
        }
      });
      localStorage.removeItem('spinstream_state');
      // Also sign out of Firebase so the auth token is fully cleared
      signOut(auth).catch(() => {});
    },

    recordVisit: () => {
      const { user, isAuthenticated } = get();
      if (!isAuthenticated || !user) return;
      
      const today = new Date().toISOString().split('T')[0];
      if (user.lastVisitDate === today) return; // already visited today

      let newStreak = user.streak;
      if (user.lastVisitDate) {
        // Compare date strings directly (avoids Math.ceil timezone edge cases)
        const lastDateStr = user.lastVisitDate;
        const lastDate = new Date(lastDateStr);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1; // first visit
      }
      
      const updatedUser = { ...user, streak: newStreak, lastVisitDate: today };
      set({ user: updatedUser });
      saveState({ user: updatedUser });
    },

    addXP: (amount) => {
      const { user } = get();
      let newXP = user.xp + amount;
      let newLevel = user.level;
      
      // Level formula: level * 1000 XP required to level up
      // Use while loop to support multiple level-ups from a single action
      while (newXP >= newLevel * 1000) {
        newXP -= newLevel * 1000;
        newLevel += 1;
      }

      const updatedUser = { ...user, xp: newXP, level: newLevel };
      set({ user: updatedUser });
      saveState({ user: updatedUser });
    },

    addToHistory: (movie, rating) => {
      const { watchedHistory, user, achievements, weeklyChallenge, badgeNotifications } = get();
      
      // Prevent duplicates in history
      if (watchedHistory.some(item => item.movie.id === movie.id)) return;

      const today = new Date().toISOString().split('T')[0];

      const newItem: WatchedHistoryItem = {
        id: `w-${Date.now()}`,
        movie,
        watchedAt: new Date().toLocaleDateString(),
        ...(rating !== undefined ? { userRating: rating } : {})
      };

      const updatedHistory = [newItem, ...watchedHistory];

      // Update weekly challenge progress
      const updatedChallenge = { ...weeklyChallenge };
      if (movie.type === 'Movie' || movie.type === 'TV Series') {
        updatedChallenge.progress = Math.min(weeklyChallenge.progress + 1, weeklyChallenge.target);
      }

      // Check newly unlocked achievements
      const newlyUnlocked: Achievement[] = [];
      const updatedAchievements = achievements.map(ach => {
        if (ach.unlockedAt !== null) return ach;
        
        let shouldUnlock = false;

        if (ach.id === 'ach-watch-1') shouldUnlock = true;
        if (ach.id === 'ach-streak-3' && user.streak >= 3) shouldUnlock = true;
        if (ach.id === 'ach-otaku') {
          const count = updatedHistory.filter(w => w.movie.type === 'Anime').length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-kdrama') {
          const count = updatedHistory.filter(w => w.movie.type === 'Drama/K-Drama').length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-binge' && updatedHistory.length >= 5) shouldUnlock = true;
        if (ach.id === 'ach-cinephile' && updatedHistory.length >= 10) shouldUnlock = true;
        if (ach.id === 'ach-action') {
          const count = updatedHistory.filter(w => (w.movie.genres || []).includes('Action')).length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-comedy') {
          const count = updatedHistory.filter(w => (w.movie.genres || []).includes('Comedy')).length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-horror') {
          const count = updatedHistory.filter(w => (w.movie.genres || []).includes('Horror')).length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-scifi') {
          const count = updatedHistory.filter(w => (w.movie.genres || []).includes('Sci-Fi')).length;
          if (count >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-critic') {
          const ratedCount = updatedHistory.filter(w => w.userRating !== undefined && w.userRating > 0).length;
          if (ratedCount >= 3) shouldUnlock = true;
        }
        if (ach.id === 'ach-weekend') {
          const day = new Date().getDay();
          if (day === 0 || day === 6) shouldUnlock = true;
        }
        
        if (shouldUnlock) {
          const unlockedAch = { ...ach, unlockedAt: new Date().toLocaleDateString() };
          newlyUnlocked.push(unlockedAch);
          return unlockedAch;
        }
        return ach;
      });

      // Calculate XP to award: 150 Base XP + 50 XP if rating is provided
      let xpEarned = 150;
      if (rating !== undefined) xpEarned += 50;

      // Check if weekly challenge is just completed
      if (updatedChallenge.progress === updatedChallenge.target && weeklyChallenge.progress < weeklyChallenge.target) {
        xpEarned += updatedChallenge.xpReward;
      }

      // Check newly unlocked achievements XP
      updatedAchievements.forEach((ach, index) => {
        if (ach.unlockedAt && achievements[index].unlockedAt === null) {
          xpEarned += ach.targetXP;
        }
      });

      const updatedUser = {
        ...user,
        lastWatchDate: today
      };

      const updatedBadgeNotifications = [...(badgeNotifications || []), ...newlyUnlocked];

      set({ 
        watchedHistory: updatedHistory, 
        user: updatedUser,
        achievements: updatedAchievements,
        badgeNotifications: updatedBadgeNotifications,
        weeklyChallenge: updatedChallenge
      });
      get().addXP(xpEarned);
      
      saveState({
        watchedHistory: updatedHistory,
        user: { ...updatedUser, xp: get().user.xp, level: get().user.level },
        achievements: updatedAchievements,
        weeklyChallenge: updatedChallenge
      });
    },

    excludeMovie: (movieId) => {
      const { excludedIds, achievements, badgeNotifications } = get();
      if (excludedIds.includes(movieId)) return;
      const updated = [...excludedIds, movieId];
      
      const newlyUnlocked: Achievement[] = [];
      const updatedAchievements = achievements.map(ach => {
        if (ach.unlockedAt === null && ach.id === 'ach-picky') {
          const unlockedAch = { ...ach, unlockedAt: new Date().toLocaleDateString() };
          newlyUnlocked.push(unlockedAch);
          return unlockedAch;
        }
        return ach;
      });

      if (newlyUnlocked.length > 0) {
        set({ 
          excludedIds: updated, 
          achievements: updatedAchievements,
          badgeNotifications: [...(badgeNotifications || []), ...newlyUnlocked]
        });
        saveState({ excludedIds: updated, achievements: updatedAchievements });
        get().addXP(newlyUnlocked[0].targetXP);
      } else {
        set({ excludedIds: updated });
        saveState({ excludedIds: updated });
      }
    },

    removeExcludeMovie: (movieId) => {
      const { excludedIds } = get();
      const updated = excludedIds.filter(id => id !== movieId);
      set({ excludedIds: updated });
      saveState({ excludedIds: updated });
    },

    spin: async (filters) => {
      const { settings, spinStats, user, achievements, badgeNotifications } = get();
      
      const match = await fetchFromTMDB(filters, settings.tmdbApiKey);
      
      if (!match) {
        return null;
      }

      // Update statistics & XP
      const today = new Date().toISOString().split('T')[0];
      
      const newSpinStats = {
        totalSpins: spinStats.totalSpins + 1,
        spinsThisSession: spinStats.spinsThisSession + 1
      };

      // Check achievements
      const newlyUnlocked: Achievement[] = [];
      const updatedAchievements = achievements.map(ach => {
        if (ach.unlockedAt !== null) return ach;
        
        let shouldUnlock = false;
        if (ach.id === 'ach-first') shouldUnlock = true;
        if (ach.id === 'ach-spinnaholic' && newSpinStats.totalSpins >= 10) shouldUnlock = true;

        if (shouldUnlock) {
          const unlockedAch = { ...ach, unlockedAt: new Date().toLocaleDateString() };
          newlyUnlocked.push(unlockedAch);
          return unlockedAch;
        }
        return ach;
      });

      let xpToAward = 10; // 10 XP per spin
      newlyUnlocked.forEach(ach => {
        xpToAward += ach.targetXP;
      });

      const updatedUser = {
        ...user,
        lastSpinDate: today
      };

      set({
        spinStats: newSpinStats,
        user: updatedUser,
        achievements: updatedAchievements,
        badgeNotifications: [...(badgeNotifications || []), ...newlyUnlocked]
      });
      get().addXP(xpToAward);

      saveState({
        spinStats: newSpinStats,
        user: { ...updatedUser, xp: get().user.xp, level: get().user.level },
        achievements: updatedAchievements
      });

      return match;
    },

    sendFriendInvite: (friendObj) => {
      const { friends, activityFeed, user, achievements, badgeNotifications } = get();
      
      const updatedFriends = [friendObj, ...friends];
      
      const updatedFeed = [
        {
          id: `feed-${Date.now()}`,
          userName: user.name,
          userAvatar: user.avatar,
          action: 'became friends with',
          targetName: friendObj.name,
          timestamp: 'Just now'
        },
        ...activityFeed
      ];

      // Check ach-social (Social Butterfly) achievement
      const newlyUnlocked: Achievement[] = [];
      const updatedAchievements = achievements.map(ach => {
        if (ach.unlockedAt === null && ach.id === 'ach-social') {
          const unlockedAch = { ...ach, unlockedAt: new Date().toLocaleDateString() };
          newlyUnlocked.push(unlockedAch);
          return unlockedAch;
        }
        return ach;
      });

      set({
        friends: updatedFriends,
        activityFeed: updatedFeed,
        achievements: updatedAchievements,
        badgeNotifications: [...(badgeNotifications || []), ...newlyUnlocked]
      });

      if (newlyUnlocked.length > 0) get().addXP(newlyUnlocked[0].targetXP);

      saveState({ friends: updatedFriends, activityFeed: updatedFeed, achievements: updatedAchievements });
    },

    acceptInvite: (inviteId) => {
      const { invites, friends, activityFeed, user, achievements, badgeNotifications } = get();
      const invite = invites.find(i => i.id === inviteId);
      if (!invite) return;

      const newFriend: Friend = {
        id: `f-${Date.now()}`,
        name: invite.senderName,
        avatar: invite.senderAvatar,
        xp: 1500,
        level: 4,
        recentWatch: 'Breaking Bad',
        status: 'online'
      };

      const updatedFriends = [...friends, newFriend];
      const updatedInvites = invites.filter(i => i.id !== inviteId);
      const updatedFeed = [
        {
          id: `feed-${Date.now()}`,
          userName: user.name,
          userAvatar: user.avatar,
          action: 'became friends with',
          targetName: invite.senderName,
          timestamp: 'Just now'
        },
        ...activityFeed
      ];

      const newlyUnlocked: Achievement[] = [];
      const updatedAchievements = achievements.map(ach => {
        if (ach.unlockedAt === null && ach.id === 'ach-social') {
          const unlockedAch = { ...ach, unlockedAt: new Date().toLocaleDateString() };
          newlyUnlocked.push(unlockedAch);
          return unlockedAch;
        }
        return ach;
      });

      set({ 
        friends: updatedFriends, 
        invites: updatedInvites, 
        activityFeed: updatedFeed,
        achievements: updatedAchievements,
        badgeNotifications: [...(badgeNotifications || []), ...newlyUnlocked]
      });
      
      let xpReward = 200; // 200 XP reward for making a friend
      if (newlyUnlocked.length > 0) xpReward += newlyUnlocked[0].targetXP;
      
      get().addXP(xpReward); 
      saveState({ 
        friends: updatedFriends, 
        invites: updatedInvites, 
        activityFeed: updatedFeed, 
        achievements: updatedAchievements,
        user: get().user 
      });
    },

    declineInvite: (inviteId) => {
      const { invites } = get();
      const updatedInvites = invites.filter(i => i.id !== inviteId);
      set({ invites: updatedInvites });
      saveState({ invites: updatedInvites });
    },

    removeFriend: (friendId) => {
      const { friends } = get();
      const updatedFriends = friends.filter(f => f.id !== friendId);
      set({ friends: updatedFriends });
      saveState({ friends: updatedFriends });
    },

    updateSettings: (newSettings) => {
      const { settings } = get();
      const updated = { ...settings, ...newSettings };
      set({ settings: updated });
      saveState({ settings: updated });
    },

    dismissBadgeNotification: (id) => {
      const { badgeNotifications } = get();
      set({ badgeNotifications: badgeNotifications.filter(n => n.id !== id) });
    }
  };
});
