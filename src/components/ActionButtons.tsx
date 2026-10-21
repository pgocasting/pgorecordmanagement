import { Button } from '@/components/ui/button';
import { Eye, Edit2, Clock, X } from 'lucide-react';

interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onTimeOut: () => void;
  onReject: () => void;
  canEdit?: boolean;
  canReject?: boolean;
  showTimeOut?: boolean;
  showEdit?: boolean;
  showReject?: boolean;
  editDisabledReason?: string;
  rejectDisabledReason?: string;
  hidden?: boolean;
}

export function ActionButtons({
  onView,
  onEdit,
  onTimeOut,
  onReject,
  canEdit = true,
  canReject = true,
  showTimeOut = true,
  showEdit = true,
  showReject = true,
  editDisabledReason,
  rejectDisabledReason,
  hidden = false,
}: ActionButtonsProps) {
  if (hidden) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center gap-1.5">
      {/* View Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-all"
        title="View"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>

      {/* Edit Button */}
      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={!canEdit}
          className={`h-7 w-7 p-0 rounded-lg transition-all ${
            canEdit
              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/20'
              : 'text-slate-600 cursor-not-allowed hover:bg-transparent'
          }`}
          title={editDisabledReason || 'Edit'}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Time Out Button */}
      {showTimeOut && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTimeOut}
          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
          title="Time Out"
        >
          <Clock className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Reject Button */}
      {showReject && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={!canReject}
          className={`h-7 w-7 p-0 rounded-lg transition-all ${
            canReject
              ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/20'
              : 'text-slate-600 cursor-not-allowed hover:bg-transparent'
          }`}
          title={rejectDisabledReason || 'Reject'}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
