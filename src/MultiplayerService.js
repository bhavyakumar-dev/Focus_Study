import { db, doc, setDoc, getDoc, updateDoc, onSnapshot } from './firebase';

export class MultiplayerService {
  constructor(roomId, roomPassword, user) {
    this.roomId = roomId;
    this.roomPassword = roomPassword || '';
    this.user = user || { name: 'Guest', email: 'guest' };
    this.userId = btoa(this.user.email).substring(0, 15);
    this.docRef = db ? doc(db, 'rooms', this.roomId) : null;
    this.unsubscribe = null;
  }

  async joinRoom() {
    if (!this.docRef) return { success: false, reason: 'Firebase not configured' };
    try {
      const roomSnap = await getDoc(this.docRef);
      if (!roomSnap.exists()) {
        // Create room as HOST
        await setDoc(this.docRef, {
          createdAt: Date.now(),
          hostId: this.userId,
          password: this.roomPassword,
          users: {
            [this.userId]: {
              name: this.user.name,
              isDead: false,
              xp: 0,
              slappedBy: null
            }
          },
          pending: {}
        });
        return { success: true, isHost: true };
      } else {
        const roomData = roomSnap.data();
        if (roomData.password && roomData.password !== this.roomPassword) {
          return { success: false, reason: 'Incorrect Room Password' };
        }
        
        // Join as pending if not host
        if (roomData.hostId !== this.userId && !roomData.users[this.userId]) {
           await updateDoc(this.docRef, {
             [`pending.${this.userId}`]: { name: this.user.name }
           });
           return { success: true, isPending: true };
        } else {
           // Rejoining
           await updateDoc(this.docRef, {
             [`users.${this.userId}.isDead`]: false
           });
           return { success: true, isHost: roomData.hostId === this.userId };
        }
      }
    } catch (e) {
      console.error("Multiplayer sync failed:", e);
      return { success: false, reason: e.message };
    }
  }

  listen(callback) {
    if (!this.docRef) return;
    this.unsubscribe = onSnapshot(this.docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }

  async acceptUser(pendingUserId, pendingUserName) {
    if (!this.docRef) return;
    try {
      await updateDoc(this.docRef, {
        [`users.${pendingUserId}`]: {
          name: pendingUserName,
          isDead: false,
          xp: 0,
          slappedBy: null
        },
        [`pending.${pendingUserId}`]: null // Remove from pending
      });
    } catch (e) {}
  }

  async rejectUser(pendingUserId) {
    if (!this.docRef) return;
    try {
      await updateDoc(this.docRef, {
        [`pending.${pendingUserId}`]: null
      });
    } catch (e) {}
  }

  async updateState(state) {
    if (!this.docRef) return;
    try {
      const updates = {};
      Object.keys(state).forEach(key => {
        updates[`users.${this.userId}.${key}`] = state[key];
      });
      await updateDoc(this.docRef, updates);
    } catch (e) {}
  }

  async slapUser(targetUserId) {
    if (!this.docRef) return;
    try {
      await updateDoc(this.docRef, {
        [`users.${targetUserId}.slappedBy`]: this.user.name,
        [`users.${targetUserId}.slapTime`]: Date.now()
      });
    } catch (e) {}
  }

  async leaveRoom() {
    if (this.unsubscribe) this.unsubscribe();
    if (!this.docRef) return;
    try {
      await updateDoc(this.docRef, {
        [`users.${this.userId}`]: null
      });
    } catch (e) {}
  }
}
