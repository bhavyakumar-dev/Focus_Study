import { db, doc, setDoc, getDoc, updateDoc, onSnapshot } from './firebase';

export class MultiplayerService {
  constructor(roomId, user) {
    this.roomId = roomId;
    this.user = user || { name: 'Guest', email: 'guest' };
    this.userId = btoa(this.user.email).substring(0, 15); // Simple safe ID
    this.docRef = db ? doc(db, 'rooms', this.roomId) : null;
    this.unsubscribe = null;
  }

  async joinRoom() {
    if (!this.docRef) return false;
    try {
      const roomSnap = await getDoc(this.docRef);
      if (!roomSnap.exists()) {
        // Create room
        await setDoc(this.docRef, {
          createdAt: Date.now(),
          users: {
            [this.userId]: {
              name: this.user.name,
              isDead: false,
              xp: 0,
              slappedBy: null
            }
          }
        });
      } else {
        // Join room
        await updateDoc(this.docRef, {
          [`users.${this.userId}`]: {
            name: this.user.name,
            isDead: false,
            xp: 0,
            slappedBy: null
          }
        });
      }
      return true;
    } catch (e) {
      console.error("Multiplayer sync failed:", e);
      return false;
    }
  }

  listen(callback) {
    if (!this.docRef) return;
    this.unsubscribe = onSnapshot(this.docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().users);
      }
    });
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
