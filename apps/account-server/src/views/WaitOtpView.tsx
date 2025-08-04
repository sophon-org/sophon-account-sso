import { Button } from '@/components/ui/button';
import { useAuthCallbacks } from '@/hooks/auth/useAuthActions';

export default function WaitOtpView() {
  const { verifyOTP } = useAuthCallbacks();

  return (
    <div className="flex items-center justify-center flex-grow">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="text-gray-600 mb-6">We've sent a verification code</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const otp = formData.get('otp') as string;
            await verifyOTP(otp);
          }}
          className="space-y-4"
        >
          <input
            className="w-full bg-white border border-gray-300 rounded-md p-2 placeholder:text-gray-400 text-center"
            type="text"
            name="otp"
            placeholder="Enter verification code"
            required
          />
          <Button type="submit">Verify</Button>
        </form>
      </div>
    </div>
  );
}
