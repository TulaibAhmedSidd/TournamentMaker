'use client';
import React from 'react';

export default function StatCard({ title, value, icon: Icon, small }) {
    return (
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500">{title}</p>
                    <p className={`mt-1 text-xl font-bold ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50">
                    <Icon className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
        </div>
    );
}
