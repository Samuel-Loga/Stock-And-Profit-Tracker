// types/database.ts
export type Json = any;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: any;
        Insert: any;
        Update: any;
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          description: string;
          image_url: string | null;
          purchase_price: number;
          selling_price: number;
          initial_quantity: number;
          quantity_remaining: number;
          quantity_sold: number;
          date_added: string;
          total_cost: number;
          expected_profit: number;
          actual_profit: number;
          status: 'active' | 'completed' | 'low_stock';
          created_at: string;
          updated_at: string;
        };
        Insert: any;
        Update: any;
      };
      sales: {
        Row: any;
        Insert: any;
        Update: any;
      };
      restocks: {
        Row: {
          id: string;
          inventory_id: string;
          user_id: string;
          quantity_added: number;
          cost_per_unit: number;
          date_added: string;
        };
        Insert: {
          inventory_id: string;
          user_id: string;
          quantity_added: number;
          cost_per_unit: number;
          date_added?: string;
        };
        Update: any;
      };
    };
  };
}