
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
    orderable_item_name?: string;
    course_bucket_name?: string;
}

interface ShippingLabelProps {
    order: Order;
}

export function ShippingLabel({ order }: ShippingLabelProps) {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`order_id:${order.id}`)}`;

    return (
        <div className="bg-white text-black p-2 font-sans" style={{ width: '105mm', height: '148mm' }}>
            <div className="border-2 border-black h-full flex flex-col p-1.5 space-y-2">
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-1">
                    <h1 className="font-bold text-base">CEYLON PHARMA COLLEGE (PVT) LTD.</h1>
                    <p className="text-[8px] leading-tight">
                        Level 35, West Tower, World trade Center, Colombo 01, 00100 | 011 7 494 335 | 071 5 884 884<br />
                        E-mail: info@pharmacollege.lk | Web: www.pharmacolege.lk
                    </p>
                </div>

                {/* Sender/Receiver */}
                <div className="grid grid-cols-2 gap-2 text-xs flex-grow" style={{ minHeight: '80px' }}>
                    <div className="border border-black p-2 rounded-md flex flex-col">
                        <p className="font-bold text-sm underline">From (Sender):</p>
                        <div className="mt-1 space-y-0.5">
                            <p className="font-bold">Ceylon Pharma College Pvt Ltd</p>
                            <p>Warehouse Pelmadulla</p>
                            <p>0715 884 884</p>
                        </div>
                    </div>
                    <div className="border border-black p-2 rounded-md flex flex-col">
                         <p className="font-bold text-sm underline">To (Receiver):</p>
                        <div className="mt-1 space-y-0.5">
                            <p className="font-bold">{order.student_number}</p>
                            <p>{order.address_line_1}{order.address_line_2 && `, ${order.address_line_2}`}</p>
                            <p>{order.city}, {order.district}</p>
                            <p className="font-bold">{order.phone_number_1}</p>
                        </div>
                    </div>
                </div>
                
                {/* Tracking & Details */}
                <div className="text-xs space-y-1">
                    <div className="text-center p-1 rounded-md border-2 border-black">
                        <p className="text-xs">Tracking Number</p>
                        <p className="font-bold text-lg tracking-wider">{order.tracking_number || 'N/A'}</p>
                    </div>

                    <table className="w-full">
                        <tbody>
                            <tr>
                                <td className="font-bold py-0.5 pr-2">Item:</td>
                                <td className="font-semibold py-0.5">{order.orderable_item_name || 'N/A'}</td>
                            </tr>
                             <tr>
                                <td className="font-bold py-0.5 pr-2">Weight:</td>
                                <td className="font-semibold py-0.5">{parseFloat(order.package_weight || '0').toFixed(3)} Kg</td>
                            </tr>
                             <tr>
                                <td className="font-bold py-0.5 pr-2">Date:</td>
                                <td className="font-semibold py-0.5">{new Date().toLocaleDateString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                {/* Footer */}
                <div className="border-2 border-black rounded-lg p-2 flex justify-between items-center text-xs">
                    <div>
                        <p className="font-bold">COD Amount: <span className="text-xl">LKR {parseFloat(order.cod_amount || '0').toFixed(2)}</span></p>
                        <p className="mt-1">Remarks: බෙදා හැරීමේදී ගැටලුවක් ඇත්නම්</p>
                        <p className="font-bold">071 5 884 884 ට අමතන්න. ස්තූතියි!</p>
                    </div>
                    <div className="text-center">
                        <Image src={qrCodeUrl} alt="QR Code" width={70} height={70} />
                        <p className="text-[9px] bg-black text-white p-0.5 rounded-b-md -mt-1 font-mono">SCAN ME</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
