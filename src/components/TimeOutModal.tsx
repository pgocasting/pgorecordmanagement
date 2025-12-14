import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TimeOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  dateTimeOut: string;
  onDateTimeOutChange: (value: string) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
  isLoading?: boolean;
}

export default function TimeOutModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  dateTimeOut,
  onDateTimeOutChange,
  remarks,
  onRemarksChange,
  isLoading = false,
}: TimeOutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Record Time Out</DialogTitle>
          <DialogDescription>
            Enter the date/time out and any remarks for this record.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="timeOutDateTime" className="text-sm font-medium text-gray-700">Date/Time OUT *</Label>
            <Input
              id="timeOutDateTime"
              type="datetime-local"
              value={dateTimeOut}
              onChange={(e) => onDateTimeOutChange(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="timeOutRemarks" className="text-sm font-medium text-gray-700">Remarks</Label>
            <Textarea
              id="timeOutRemarks"
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              className="mt-2"
              placeholder="Enter time out remarks (optional)"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onConfirm}
              disabled={!dateTimeOut || isLoading}
            >
              {isLoading ? 'Recording...' : 'Record Time Out'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
