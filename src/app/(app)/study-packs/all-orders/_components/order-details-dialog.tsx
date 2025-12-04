

'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Printer, Truck } from 'lucide-react';
import { PrintLabelDialog } from './print-label-dialog';

type OrderStatus = 'pending' | 'packed' | 'handed over' | 'delivered' | 'returned' | 'cancelled';

interface Order {
    id: string;
    student_number: string;
    orderable_item_id: string;
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
    order_date?: string;
    delivery_date?: string;
    price?: string;
    course_id?: string;
    course_bucket_id?: string;
    orderable_item_name?: string;
    course_name?: string;
    course_bucket_name?: string;
    bucket_name?: string;
}

interface OrderDetailsDialogProps {
  order: Order;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOrderUpdate: (updatedOrder: Order) => void;
}

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
    'pending': 'packed',
    'packed': 'handed over',
    'handed over': 'delivered',
    'delivered': null, // End of primary flow
    'returned': null, // Terminal state
    'cancelled': null, // Terminal state
};


export function OrderDetailsDialog({ order, isOpen, onOpenChange, onOrderUpdate }: OrderDetailsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [codAmount, setCodAmount] = useState(order.cod_amount || '0.00');
  const [packageWeight, setPackageWeight] = useState(order.package_weight || '0.00');
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.order_status);
  const { toast } = useToast();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setTrackingNumber(order.tracking_number || '');
        setCodAmount(order.cod_amount || '0.00');
        setPackageWeight(order.package_weight || '0.00');
        setCurrentStatus(order.order_status);
    }
  }, [order, isOpen]);

  const handleUpdate = async (newStatus?: OrderStatus) => {
    setIsSubmitting(true);
    try {
        const updateData = {
            order_status: newStatus || currentStatus,
            tracking_number: trackingNumber,
            cod_amount: parseFloat(codAmount) || 0,
            package_weight: parseFloat(packageWeight) || 0,
        };

        const response = await api.put(`/student-orders/${order.id}`, updateData);

        if (response.status === 200) {
            toast({
                title: 'Order Updated',
                description: `Order #${order.id} has been successfully updated.`,
            });
            onOrderUpdate(response.data.data);
            if (newStatus) { 
              onOpenChange(false);
            }
        } else {
            throw new Error(response.data.message || 'An unknown error occurred.');
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update the order.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'delivered': return 'secondary';
        case 'shipped': case 'handed over': return 'default';
        case 'cancelled': case 'returned': return 'destructive';
        case 'pending': case 'packed':
        default: return 'outline';
    }
  }

  const nextStatus = statusFlow[currentStatus];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
                <div>
                    <DialogTitle>
                    Order Details
                    </DialogTitle>
                    <DialogDescription>
                    Reference ID: #{order.id}
                    </DialogDescription>
                </div>
                 <Badge variant={getStatusVariant(order.order_status)} className="capitalize text-base ml-4">{order.order_status}</Badge>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
              {/* Left Column */}
              <div className="md:col-span-2 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-muted-foreground">Student Number</p>
                          <p className="font-semibold font-mono">{order.student_number}</p>
                      </div>
                       <div>
                          <p className="text-muted-foreground">Order Item</p>
                          <p className="font-semibold text-lg">{order.orderable_item_name}</p>
                      </div>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                          <p className="text-muted-foreground">Course</p>
                          <p className="font-semibold">{order.course_name || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-muted-foreground">Bucket</p>
                          <p className="font-semibold">{order.course_bucket_name || 'N/A'}</p>
                      </div>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Delivery Address</p>
                      <address className="not-italic font-medium">
                          {order.address_line_1}<br />
                          {order.address_line_2 && <>{order.address_line_2}<br /></>}
                          {order.city}, {order.district}<br />
                          {order.postal_code}<br />
                          {order.phone_number_1}
                      </address>
                  </div>
                   <div className="pt-2">
                      <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
                          <Printer className="mr-2 h-4 w-4" /> Print Delivery Label
                      </Button>
                  </div>
              </div>
              
              {/* Right Column */}
              <div className="md:col-span-1 space-y-4 text-sm">
                   <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-semibold">{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</p>
                    </div>
                  <div>
                      <p className="text-muted-foreground">Packed Date</p>
                      <p className="font-semibold">Not Set</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Delivered Date</p>
                      <p className="font-semibold">Not Set</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">QR Code</p>
                      <div className="w-24 h-24 bg-muted rounded-md mt-1 flex items-center justify-center text-xs text-muted-foreground">
                          Placeholder
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-t pt-4">
              <div className="space-y-2">
                  <Label htmlFor="tracking-number">Tracking Number</Label>
                  <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="cod-amount">COD Amount</Label>
                  <Input id="cod-amount" type="number" value={codAmount} onChange={(e) => setCodAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="package-weight">Package Weight (KG)</Label>
                  <Input id="package-weight" type="number" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} />
              </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            {nextStatus && (
              <Button onClick={() => handleUpdate(nextStatus)} disabled={isSubmitting}>
                  {isSubmitting ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                      </>
                  ) : (
                      <>
                          <Truck className="mr-2 h-4 w-4"/>
                          Update to {nextStatus}
                      </>
                  )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isPrintDialogOpen && (
          <PrintLabelDialog
              order={order}
              isOpen={isPrintDialogOpen}
              onOpenChange={setIsPrintDialogOpen}
          />
      )}
    </>
  );
}
