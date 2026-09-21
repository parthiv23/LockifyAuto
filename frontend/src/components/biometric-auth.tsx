import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBiometric } from '@/hooks/use-biometric';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Fingerprint, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BiometricAuthProps {
  userId: string;
  username: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showRegisterOption?: boolean;
}

export function BiometricAuth({ 
  userId, 
  username, 
  onSuccess, 
  onError, 
  disabled = false,
  showRegisterOption = true 
}: BiometricAuthProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasStoredCredential, setHasStoredCredential] = useState(false);
  
  const { toast } = useToast();
  const { biometricEnabled } = useUserPreferences();
  const { 
    isLoading, 
    isRegistering, 
    isAuthenticating, 
    error,
    register,
    authenticate,
    hasCredential,
    shouldOffer
  } = useBiometric();

  // Check if we should show biometric options
  useEffect(() => {
    const checkShouldShow = async () => {
      // Only show if biometric is enabled in user preferences
      if (!biometricEnabled) {
        setShouldShow(false);
        return;
      }

      const shouldOfferBiometric = await shouldOffer();
      const hasCred = hasCredential(userId);
      
      setShouldShow(shouldOfferBiometric && (hasCred || showRegisterOption));
      setHasStoredCredential(hasCred);
    };

    checkShouldShow();
  }, [userId, biometricEnabled, shouldOffer, hasCredential, showRegisterOption]);

  const handleAuthenticate = async () => {
    try {
      const result = await authenticate(userId, username);
      
      if (result.success) {
        toast({
          title: "Biometric authentication successful",
          description: "Welcome back!"
        });
        onSuccess();
      } else {
        const errorMsg = result.error || 'Authentication failed';
        toast({
          title: "Authentication failed",
          description: errorMsg,
          variant: "destructive"
        });
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      toast({
        title: "Authentication failed",
        description: errorMsg,
        variant: "destructive"
      });
      onError?.(errorMsg);
    }
  };

  const handleRegister = async () => {
    try {
      const result = await register(userId, username);
      
      if (result.success) {
        toast({
          title: "Biometric authentication set up",
          description: "You can now use your fingerprint to log in"
        });
        setHasStoredCredential(true);
        // Auto-authenticate after registration
        setTimeout(() => {
          handleAuthenticate();
        }, 500);
      } else {
        const errorMsg = result.error || 'Registration failed';
        toast({
          title: "Registration failed",
          description: errorMsg,
          variant: "destructive"
        });
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      toast({
        title: "Registration failed",
        description: errorMsg,
        variant: "destructive"
      });
      onError?.(errorMsg);
    }
  };

  // Don't show if not supported or loading
  if (isLoading || !shouldShow) {
    return null;
  }

  // Show error if there's one
  if (error) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Biometric authentication error: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Biometric authentication button */}
      {hasStoredCredential && (
        <Button
          type="button"
          onClick={handleAuthenticate}
          disabled={disabled || isAuthenticating || isRegistering}
          className="h-11 w-full rounded-xl border border-current/15 bg-transparent text-xs font-semibold text-foreground hover:bg-current/5"
          variant="outline"
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4 mr-2 text-[#4b8b69]" />
              Try fingerprint / device biometrics
            </>
          )}
        </Button>
      )}

      {/* Registration button */}
      {!hasStoredCredential && showRegisterOption && (
        <Button
          type="button"
          onClick={handleRegister}
          disabled={disabled || isRegistering || isAuthenticating}
          variant="outline"
          className="h-11 w-full rounded-xl border border-current/15 text-xs font-semibold hover:bg-current/5"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4 mr-2 text-[#4b8b69]" />
              Set up fingerprint login
            </>
          )}
        </Button>
      )}

      {/* Info text */}
      <div className="text-center text-[0.68rem] text-muted-foreground">
        {hasStoredCredential ? (
          <>
            <CheckCircle className="w-3 h-3 inline mr-1 text-[#4b8b69]" />
            Biometric authentication is set up
          </>
        ) : (
          "Use your device fingerprint after entering your username"
        )}
      </div>
    </div>
  );
}

export default BiometricAuth;
