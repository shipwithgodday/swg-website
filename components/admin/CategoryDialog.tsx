'use client';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CategoryForm,
  type CategoryFormValue,
} from '@/components/admin/CategoryForm';

interface Props {
  /** The category being edited, or undefined when creating a new one. */
  category?: CategoryFormValue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Centered modal that hosts the category create/edit form. */
export function CategoryDialog({ category, open, onOpenChange }: Props) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit category' : 'New category'}
          </DialogTitle>
          <DialogDescription>
            Categories group products on the storefront.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          key={category?.id ?? 'new'}
          category={category}
          onSaved={() => {
            onOpenChange(false);
            router.refresh();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
