import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones } from "lucide-react";
import { Link } from "wouter";

export function CustomerService() {
  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-3">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-medium text-gray-900">Customer Service</h1>
          </div>
        </div>
      </header>

      {/* Main Content - Empty */}
      <main className="flex-1 overflow-auto bg-gray-50 pb-20">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <Headphones className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Customer Service</h2>
          <p className="text-sm text-gray-500">Coming Soon</p>
        </div>
      </main>
    </div>
  );
}