import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';

export function getFirebaseAuth() {
  return getAuth(getApp());
}

export async function getCurrentIdToken(): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
}
