'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Tag } from 'lucide-react';

interface BulkCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: any[];
  targetCategoryName: string;
  onConfirm: () => void;
  loading: boolean;
}

export function BulkCategoryModal({ 
  open, 
  onOpenChange, 
  selectedItems, 
  targetCategoryName, 
  onConfirm,
  loading 
}: BulkCategoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Confirm Category Change
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              You are moving <b>{selectedItems.length}</b> products to the <b>{targetCategoryName}</b> category.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Items to be updated:</p>
            <div className="max-h-[150px] overflow-y-auto border rounded-md p-2 bg-slate-50 space-y-1">
              {selectedItems.map((item) => (
                <div key={item.id} className="text-sm text-slate-700 truncate py-1 border-b last:border-0 border-slate-200">
                  • {item.item_name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-slate-900">
            {loading ? "Updating..." : "Confirm Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}