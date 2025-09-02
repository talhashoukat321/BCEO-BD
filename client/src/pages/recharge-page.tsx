import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function RechargePage() {
  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/customer">
                <Button variant="ghost" size="sm" className="mr-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-medium text-gray-900">Top-up funds</h1>
            </div>
            <Link href="/top-up-records">
              <Button variant="ghost" size="sm" className="text-blue-600">
                Top-up Records
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 text-lg mb-2">
              No content available
            </div>
            <div className="text-gray-500 text-sm">
              Contact customer service for recharge options
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}