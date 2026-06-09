type LoadingScreenProps = {
  label?: string;
};

export default function LoadingScreen({ label = 'Loading' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 w-full px-6">
        <div className="pgo-logo-spinner" role="status" aria-label={label}>
          <div className="pgo-logo-spinner__ring" aria-hidden="true" />
          <img
            src="/images/bataan-logo.png"
            alt="Bataan"
            className="h-20 w-20 object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
