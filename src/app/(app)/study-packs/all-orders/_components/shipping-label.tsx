
'use client';

import Image from 'next/image';

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
    course_id?: string;
    course_bucket_id?: string;
    course_name?: string;
    bucket_name?: string;
}

interface ShippingLabelProps {
    order: Order;
}

export function ShippingLabel({ order }: ShippingLabelProps) {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`order_id:${order.id}`)}`;

    return (
        <div className="bg-white text-black p-4 font-sans" style={{ width: '105mm', height: '148mm' }}>
            <div className="border border-black h-full flex flex-col p-2">
                {/* Header */}
                <div className="bg-[#1E8A5A] text-white p-2 rounded-lg">
                    <div>
                        <h1 className="font-bold text-lg whitespace-nowrap">CEYLON PHARMA COLLEGE (PVT) LTD.</h1>
                        <p className="text-xs">Level 35, West Tower, World trade Center, Colombo 01, 00100</p>
                        <p className="text-xs">011 7 494 335 | 071 5 884 884</p>
                        <p className="text-xs">E-mail: info@pharmacollege.lk | Web: www.pharmacolege.lk</p>
                    </div>
                </div>

                {/* Sender/Receiver */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md text-sm">Sender Detail</div>
                    <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md text-sm">Receiver Detail</div>
                    <div className="text-xs">
                        <p className="font-bold">Ceylon Pharma College Pvt Ltd</p>
                        <p>Warehouse Pelmadulla</p>
                        <p>0715 884 884</p>
                    </div>
                    <div className="text-xs">
                        <p className="font-bold">{order.student_number}</p>
                        <p>{order.address_line_1}{order.address_line_2 && `, ${order.address_line_2}`}</p>
                        <p>{order.city}, {order.district}</p>
                        <p>{order.phone_number_1}</p>
                    </div>
                </div>
                
                {/* Tracking */}
                <div className="bg-[#1E8A5A] text-white text-center mt-2 p-1 rounded-lg">
                    <p className="text-sm">Tracking Number</p>
                    <div className="bg-white text-black font-bold text-xl p-1 rounded-md my-1 w-1/2 mx-auto">
                        {order.tracking_number || 'N/A'}
                    </div>
                </div>
                
                {/* Details */}
                <div className="mt-2 space-y-1 text-sm">
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1">Item Code</div>
                        <div className="col-span-2 text-center font-semibold">{order.item_name || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1">Packed Date</div>
                        <div className="col-span-2 text-center font-semibold">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1">Student number</div>
                        <div className="col-span-2 text-center font-semibold">{order.student_number}</div>
                    </div>
                     <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1">Weight</div>
                        <div className="col-span-2 text-center font-semibold">{order.package_weight || '0.000'} Kg</div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="border border-gray-400 rounded-lg p-2 mt-auto flex justify-between items-center text-xs">
                    <div>
                        <p className="font-bold">Remarks</p>
                        <p>බෙදා හැරීමේදී ගැටලුවක් ඇත්නම්</p>
                        <p className="font-bold">071 5 884 884 ට අමතන්න. ස්තූතියි!</p>
                        <p className="mt-2">COD Amount: <span className="font-bold text-base">LKR {parseFloat(order.cod_amount || '0').toFixed(2)}</span></p>
                    </div>
                    <div className="text-center">
                        <Image src={qrCodeUrl} alt="QR Code" width={70} height={70} />
                        <p className="text-xs bg-black text-white p-1 rounded-b-md">Scan Me</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
