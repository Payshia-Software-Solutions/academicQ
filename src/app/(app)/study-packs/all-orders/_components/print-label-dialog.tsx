
'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShippingLabel } from './shipping-label';
import { Printer } from 'lucide-react';

type OrderStatus = 'pending' | 'packed' | 'handed over' | 'delivered' | 'returned' | 'cancelled';

interface Order {
    id: string;
    student_number: string;
    item_name?: string;
    order_status: OrderStatus;
    address_line_1: string;
    address_line_2: string;
    city: string;
    district: string;
    postal_code: string;
    phone_number_1: string;
    phone_number_2: string;
    created_at: string;
    tracking_number?: string;
    cod_amount?: string;
    package_weight?: string;
    course_name?: string;
    bucket_name?: string;
}

interface PrintLabelDialogProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PrintLabelDialog({ order, isOpen, onOpenChange }: PrintLabelDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = labelRef.current;
    if (printContent) {
        const originalContents = document.body.innerHTML;
        const printSection = printContent.innerHTML;

        document.body.innerHTML = printSection;
        // Temporarily add a wrapper to ensure correct sizing for printing
        const wrapper = document.createElement('div');
        wrapper.innerHTML = printSection;
        document.body.innerHTML = '';
        document.body.appendChild(wrapper);


        window.print();
        document.body.innerHTML = originalContents;
        // We need to reload to re-initialize scripts and event listeners
        window.location.reload();
    }
  };
  
   const handlePrintSimple = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && labelRef.current) {
        const styles = Array.from(document.styleSheets)
            .map(s => `<link rel="stylesheet" href="${s.href}">`)
            .join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Label</title>
                    ${styles}
                    <style>
                        @page { size: A6; margin: 0; }
                        body { margin: 0; }
                    </style>
                </head>
                <body>
                    ${labelRef.current.outerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <div ref={labelRef} className="printable-area">
          <ShippingLabel order={order} />
        </div>
        <DialogFooter className="p-4 border-t print:hidden">
          <Button onClick={handlePrintSimple}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
