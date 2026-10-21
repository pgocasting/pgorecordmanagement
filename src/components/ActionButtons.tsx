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
    <div className="flex items-center justify-center gap-2">
      {/* View Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        title="View"
      >
        <Eye className="h-3 w-3" />
      </Button>

      {/* Edit Button */}
      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          disabled={!canEdit}
          className={`h-6 w-6 p-0 ${
            canEdit
              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
              : 'text-gray-400 cursor-not-allowed hover:bg-transparent'
          }`}
          title={editDisabledReason || 'Edit'}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}

      {/* Time Out Button */}
      {showTimeOut && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onTimeOut}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Time Out"
        >
          <Clock className="h-3 w-3" />
        </Button>
      )}

      {/* Reject Button */}
      {showReject && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={!canReject}
          className={`h-6 w-6 p-0 ${
            canReject
              ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
              : 'text-gray-400 cursor-not-allowed hover:bg-transparent'
          }`}
          title={rejectDisabledReason || 'Reject'}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
