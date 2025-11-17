import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Package, Rocket } from 'lucide-react';
import { PayterProductTab, PayterProduct } from './PayterProductTab';
import { Customer } from './CustomerModule';

interface ProductModuleProps {
  payterProducts?: PayterProduct[];
  onPayterProductsChange?: (products: PayterProduct[]) => void;
  customers?: Customer[];
}

// PERFORMANCE: React.memo prevents unnecessary re-renders
export const ProductModule = React.memo(function ProductModule({ payterProducts = [], onPayterProductsChange = () => {}, customers = [] }: ProductModuleProps) {
  const [activeTab, setActiveTab] = useState('payter');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h2>
        <p className="text-sm font-medium text-gray-600">
          Ürün modülleri ve yönetim araçları
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="payter" className="flex items-center gap-2">
            <Rocket size={16} />
            Payter
          </TabsTrigger>
          <TabsTrigger value="diger" className="flex items-center gap-2">
            <Package size={16} />
            Diğer Ürünler
          </TabsTrigger>
        </TabsList>

        {/* PAYTER */}
        <TabsContent value="payter" className="space-y-6">
          <PayterProductTab 
            products={payterProducts}
            onProductsChange={onPayterProductsChange}
            customers={customers}
          />
        </TabsContent>

        {/* DİĞER ÜRÜNLER */}
        <TabsContent value="diger" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diğer Ürünler</CardTitle>
              <CardDescription>
                Genel ürün yönetimi ve tanımlamaları
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900">Ürün Modülü</h3>
                  <p className="text-gray-500">
                    Bu alan genel ürün yönetimi için ayrılmıştır. Yakında eklenecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});
