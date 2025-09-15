import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useState } from 'react';
import { Loader } from '@/components/loader';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { MainStateMachineContext } from '@/context/state-machine-context';
import { useAuthCallbacks } from '@/hooks/auth/useAuthActions';
import { maskEmail } from '@/lib/formatting';
import { windowService } from '@/service/window.service';

export default function WaitOtpView() {
  const email = MainStateMachineContext.useSelector(
    (state) => state.context.email,
  );
  const { verifyOTP, resendOTP, otpError } = useAuthCallbacks();
  const isMobile = windowService.isMobile();
  const [otpLoading, setOtpLoading] = useState(false);

  return (
    <div
      className={`flex items-center justify-center flex-grow ${
        !isMobile ? 'h-full' : ''
      }`}
    >
      <div className="text-center">
        <p className="text-gray-600 mb-6">
          Check {email ? maskEmail(email) : 'your email'} for the code
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setOtpLoading(true);
              const formData = new FormData(e.currentTarget);
              const otp = formData.get('otp') as string;
              await verifyOTP(otp);
            } finally {
              setOtpLoading(false);
            }
          }}
          className="space-y-6 flex flex-col items-center justify-center"
        >
          <InputOTP
            name="otp"
            required
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            autoFocus
            data-testid="login-otp-input"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            disabled={otpLoading}
            data-testid="login-otp-submit"
          >
            {otpLoading ? (
              <Loader className="w-4 h-4 border-white border-r-transparent" />
            ) : (
              'Verify'
            )}
          </Button>
          <p className="text-gray-600">
            Did not receive a code? Check spam or{' '}
            <button
              type="button"
              className="text-blue-500 underline"
              onClick={resendOTP}
            >
              re-send
            </button>
          </p>
        </form>
        {otpError && (
          <div className="mt-4 px-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">{otpError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
