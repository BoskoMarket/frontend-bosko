/**
 * useGoogleSignIn — lógica compartida de login/registro con Google.
 * Usada por LogInView y RegisterView (mismo botón, mismo flujo: Google no
 * distingue "crear cuenta" de "iniciar sesión", el backend resuelve cuál es).
 *
 * Flujo: GoogleSignin (idToken de Google) → Firebase (signInWithCredential,
 * mismo patrón que VerifyPhoneScreen) → idToken de Firebase → AuthContext.loginWithGoogle.
 */

import { useCallback, useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { GOOGLE_WEB_CLIENT_ID } from '@/core/config/env';

export function useGoogleSignIn() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  /** Devuelve true si logueó, false si el usuario canceló. Tira si falla de verdad. */
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Login con Google todavía no está configurado.');
    }

    setLoading(true);
    try {
      // Requires dinámicos: son módulos nativos (TurboModule), rompen el bundle
      // si se importan a nivel de archivo sin dev build.
      const { GoogleSignin, isSuccessResponse, isCancelledResponse } = require('@react-native-google-signin/google-signin');
      const auth = require('@react-native-firebase/auth').default;

      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) return false;
      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google no devolvió un idToken válido.');
      }

      const credential = auth.GoogleAuthProvider.credential(response.data.idToken);
      const userCredential = await auth().signInWithCredential(credential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      await loginWithGoogle(firebaseIdToken);
      return true;
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  return { loading, signInWithGoogle };
}

/**
 * useGoogleReauth — pide un idToken de Google FRESCO sin iniciar sesión de nuevo.
 * Se usa para confirmar acciones sensibles (ej: eliminar cuenta) de usuarios
 * que no tienen contraseña. Devuelve null si el usuario canceló el selector.
 */
export function useGoogleReauth() {
  const [loading, setLoading] = useState(false);

  const getGoogleIdToken = useCallback(async (): Promise<string | null> => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Login con Google todavía no está configurado.');
    }
    setLoading(true);
    try {
      const { GoogleSignin, isSuccessResponse, isCancelledResponse } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return null;
      if (!isSuccessResponse(response) || !response.data.idToken) {
        throw new Error('Google no devolvió un idToken válido.');
      }
      return response.data.idToken as string;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, getGoogleIdToken };
}
