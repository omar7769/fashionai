import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@fashionai_user_id';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedUserId = null;

export async function getUserId() {
  if (cachedUserId) return cachedUserId;

  let id = await AsyncStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }
  cachedUserId = id;
  return id;
}
