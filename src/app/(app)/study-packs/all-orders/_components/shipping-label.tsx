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
    course_name?: string;
    bucket_name?: string;
}

interface ShippingLabelProps {
    order: Order;
}

export function ShippingLabel({ order }: ShippingLabelProps) {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`order_id:${order.id}`)}`;

    return (
        <div className="bg-white text-black p-2 font-sans" style={{ width: '105mm', height: '148mm' }}>
            <div className="border border-black h-full flex flex-col p-1">
                {/* Header */}
                <div className="bg-[#1E8A5A] text-white p-1 rounded-t-lg">
                    <h1 className="font-bold text-base text-center">CEYLON PHARMA COLLEGE (PVT) LTD.</h1>
                    <p className="text-[8px] text-center">Level 35, West Tower, World trade Center, Colombo 01, 00100</p>
                    <p className="text-[8px] text-center">011 7 494 335 | 071 5 884 884</p>
                    <p className="text-[8px] text-center">E-mail: info@pharmacollege.lk | Web: www.pharmacolege.lk</p>
                </div>

                {/* Sender/Receiver */}
                <div className="grid grid-cols-2 gap-2 mt-1 text-[9px]">
                    <div className="bg-[#1E8A5A] text-white text-center p-0.5 rounded-md text-xs col-span-2">Details</div>
                    <div className="border border-gray-400 p-1 rounded-md">
                        <p className="font-bold underline">Sender:</p>
                        <p className="font-bold">Ceylon Pharma College Pvt Ltd</p>
                        <p>Warehouse Pelmadulla</p>
                        <p>0715 884 884</p>
                    </div>
                    <div className="border border-gray-400 p-1 rounded-md">
                         <p className="font-bold underline">Receiver:</p>
                        <p className="font-bold">{order.student_number}</p>
                        <p>{order.address_line_1}{order.address_line_2 && `, ${order.address_line_2}`}</p>
                        <p>{order.city}, {order.district}</p>
                        <p>{order.phone_number_1}</p>
                    </div>
                </div>
                
                {/* Tracking */}
                <div className="bg-[#1E8A5A] text-white text-center mt-1 p-0.5 rounded-lg">
                    <p className="text-xs">Tracking Number</p>
                    <div className="bg-white text-black font-bold text-base p-0.5 rounded-md mt-0.5 w-2/3 mx-auto">
                        {order.tracking_number || 'N/A'}
                    </div>
                </div>
                
                {/* Details */}
                <div className="mt-1 space-y-0.5 text-xs">
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1 text-xs">Item Code</div>
                        <div className="col-span-2 text-center font-semibold">{order.item_name || 'N/A'}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1 text-xs">Packed Date</div>
                        <div className="col-span-2 text-center font-semibold">{new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1 text-xs">Student number</div>
                        <div className="col-span-2 text-center font-semibold">{order.student_number}</div>
                    </div>
                     <div className="grid grid-cols-3 items-center">
                        <div className="bg-[#1E8A5A] text-white text-center p-1 rounded-md col-span-1 text-xs">Weight</div>
                        <div className="col-span-2 text-center font-semibold">{parseFloat(order.package_weight || '0').toFixed(3)} Kg</div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="border border-gray-400 rounded-lg p-1 mt-auto flex justify-between items-center text-[9px]">
                    <div>
                        <p className="font-bold">Remarks</p>
                        <p>බෙදා හැරීමේදී ගැටලුවක් ඇත්නම්</p>
                        <p className="font-bold">071 5 884 884 ට අමතන්න. ස්තූතියි!</p>
                        <p className="mt-1">COD Amount: <span className="font-bold text-sm">LKR {parseFloat(order.cod_amount || '0').toFixed(2)}</span></p>
                    </div>
                    <div className="text-center">
                        <Image src={qrCodeUrl} alt="QR Code" width={60} height={60} />
                        <p className="text-[8px] bg-black text-white p-0.5 rounded-b-md -mt-1">Scan Me</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
