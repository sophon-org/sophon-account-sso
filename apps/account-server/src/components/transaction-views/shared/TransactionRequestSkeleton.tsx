import MessageContainer from '@/components/ui/messageContainer';
import VerificationImage from '@/components/ui/verification-image';

export default function TransactionRequestSkeleton({
  isMobile,
}: {
  isMobile: boolean;
}) {
  return (
    <div className="text-center flex flex-col items-center justify-center gap-8">
      {/* Verification Image Skeleton */}
      {!isMobile && (
        <VerificationImage
          icon={
            <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
          }
        />
      )}

      {/* Title Skeleton */}
      <div className="flex flex-col items-center justify-center">
        <div className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-2" />
      </div>

      {/* Content Skeleton */}
      <div className="w-full">
        <MessageContainer>
          <div className="text-sm text-black flex flex-col gap-4">
            {/* Token/Contract Name Skeleton */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-300 rounded animate-pulse" />
            </div>

            {/* Recipient/To Skeleton */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-8 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-300 rounded animate-pulse" />
            </div>

            {/* Amount Skeleton */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-300 rounded animate-pulse" />
            </div>

            {/* Additional Info Skeleton (for complex transactions) */}
            {!isMobile && (
              <div className="flex flex-col gap-1">
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-300 rounded animate-pulse" />
              </div>
            )}
          </div>
        </MessageContainer>
      </div>
    </div>
  );
}
