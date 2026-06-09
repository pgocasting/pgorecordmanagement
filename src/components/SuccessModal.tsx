import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  isError?: boolean;
}

export default function SuccessModal({ open, onOpenChange, message, isError = false }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={isError ? 'text-red-600' : 'text-green-600'}>
            {isError ? 'Error' : 'Success'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4 py-4">
          <div className="shrink-0 mt-0.5">
            {isError ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <p className="text-sm text-gray-700 flex-1">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className={isError ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
