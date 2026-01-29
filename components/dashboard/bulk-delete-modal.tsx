// components/dashboard/bulk-delete-modal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function BulkDeleteModal({ open, onOpenChange, count, onConfirm, loading }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" /> Bulk Delete
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center space-y-3">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl font-bold text-2xl">
            {count} Items
          </div>
          <p className="text-sm text-slate-600 px-4">
            You are about to delete these items permanently. This will also clear their batch associations and sales records.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Deleting..." : "Confirm Bulk Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}