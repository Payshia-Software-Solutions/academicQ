
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
  const [codAmount, setCodAmount] = useState(order.cod_amount || '500');
  const [packageWeight, setPackageWeight] = useState(order.package_weight || '1');
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.order_status);
  const { toast } = useToast();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setTrackingNumber(order.tracking_number || '');
        setCodAmount(order.cod_amount || '500');
        setPackageWeight(order.package_weight || '1');
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

        const response = await api.post(`/student-orders/${order.id}`, updateData);
        
        if (response.status === 200 && response.data) {
            toast({
                title: 'Order Updated',
                description: `Order #${order.id} has been successfully updated.`,
            });
            onOrderUpdate(response.data);
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
    switch (status.toLowerCase()) {
        case 'delivered': return 'secondary';
        case 'shipped': case 'handed over': return 'default';
        case 'cancelled': case 'returned': return 'destructive';
        case 'pending': case 'packed':
        default: return 'outline';
    }
  }

  const nextStatus = statusFlow[currentStatus];
  const isHandedOver = order.order_status === 'handed over';

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-base border-b pb-2">Recipient Info</h3>
                   <div>
                      <p className="text-muted-foreground">Student Number</p>
                      <p className="font-semibold font-mono">{order.student_number}</p>
                  </div>
                  <div>
                      <p className="text-muted-foreground">Delivery Address</p>
                      <address className="not-italic font-medium">
                          {order.address_line_1}<br />
                          {order.address_line_2 && <>{order.address_line_2}<br /></>}
                          {order.city}, {order.district}, {order.postal_code}<br />
                          {order.phone_number_1}
                      </address>
                  </div>
              </div>
              
              <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-base border-b pb-2">Order Info</h3>
                   <div>
                      <p className="text-muted-foreground">Order Item</p>
                      <p className="font-semibold">{order.item_name || order.orderable_item_name || 'N/A'}</p>
                  </div>
                   <div>
                      <p className="text-muted-foreground">Course / Bucket</p>
                      <p className="font-semibold">{order.course_name || 'N/A'} / {order.course_bucket_name || order.bucket_name || 'N/A'}</p>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-semibold">{format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}</p>
                    </div>
                     <div>
                        <p className="text-muted-foreground">Delivered Date</p>
                        <p className="font-semibold">{order.delivery_date ? format(new Date(order.delivery_date), 'yyyy-MM-dd HH:mm') : 'N/A'}</p>
                    </div>
                  </div>
              </div>
              
              <div className="md:col-span-2 space-y-4 text-sm">
                  <h3 className="font-semibold text-base border-b pb-2">Shipping Details</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                        <div className="space-y-2">
                            <Label htmlFor="tracking-number">Tracking Number</Label>
                            <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} disabled={isHandedOver} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cod-amount">COD Amount (LKR)</Label>
                            <Input id="cod-amount" type="number" value={codAmount} onChange={(e) => setCodAmount(e.target.value)} disabled={isHandedOver} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="package-weight">Weight (KG)</Label>
                            <Input id="package-weight" type="number" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} disabled={isHandedOver} />
                        </div>
                    </div>
              </div>
          </div>


          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between w-full">
            <div>
                 <Button
                    variant="outline"
                    onClick={() => setIsPrintDialogOpen(true)}
                    disabled={order.order_status === 'pending'}
                  >
                    <Printer className="mr-2 h-4 w-4" /> Print Delivery Label
                </Button>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
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
            </div>
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
