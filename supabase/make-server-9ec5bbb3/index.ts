import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// ========================================
// SUPABASE CLIENT HELPER
// ========================================
const getSupabase = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
  }),
);

// Explicit OPTIONS handler for preflight requests
app.options("*", (c) => {
  return c.text("", 204);
});

// Health check endpoint
app.get("/make-server-9ec5bbb3/health", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Direct Postgres mode enabled",
    timestamp: new Date().toISOString() 
  });
});

// ========================================
// CUSTOMER ENDPOINTS (musteri_cari_kartlari)
// ========================================

// GET /customers - Tüm müşterileri getir
app.get("/make-server-9ec5bbb3/customers", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("musteri_cari_kartlari")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching customers:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} customers`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ Error fetching customers:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /customers/:id - Tek müşteri getir
app.get("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from("musteri_cari_kartlari")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Error fetching customer:", error);
      return c.json({ success: false, error: "Customer not found" }, 404);
    }

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Error fetching customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /customers - Müşteri ekle (tek veya toplu)
app.post("/make-server-9ec5bbb3/customers", async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabase();
    
    // Tek müşteri veya array gelebilir
    const customers = Array.isArray(body) ? body : [body];
    
    // Müşterileri ekle
    const { data, error } = await supabase
      .from("musteri_cari_kartlari")
      .insert(customers)
      .select();

    if (error) {
      console.error("❌ Error inserting customers:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Inserted ${data.length} customers`);
    return c.json({ 
      success: true, 
      data,
      count: data.length 
    });
  } catch (error: any) {
    console.error("❌ Error inserting customers:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /customers/:id - Tek müşteri güncelle
app.put("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("musteri_cari_kartlari")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating customer:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Customer updated: ${id}`);
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Error updating customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// DELETE /customers/:id - Müşteri sil
app.delete("/make-server-9ec5bbb3/customers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const supabase = getSupabase();

    const { error } = await supabase
      .from("musteri_cari_kartlari")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ Error deleting customer:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Customer deleted: ${id}`);
    return c.json({ success: true, message: "Customer deleted" });
  } catch (error: any) {
    console.error("❌ Error deleting customer:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// PRODUCT ENDPOINTS (payterProducts)
// ========================================

// GET /products - Tüm ürünleri getir
app.get("/make-server-9ec5bbb3/products", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("payterProducts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching products:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} products`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ Error fetching products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /products/sync - Ürün sync (Excel veya API'den)
app.post("/make-server-9ec5bbb3/products/sync", async (c) => {
  try {
    const body = await c.req.json();
    const { products, source = "excel", strategy = "merge" } = body;

    if (!Array.isArray(products)) {
      return c.json(
        { success: false, error: "products must be an array" },
        400
      );
    }

    const supabase = getSupabase();
    let stats = {
      total: 0,
      added: 0,
      updated: 0,
    };

    if (strategy === "merge") {
      // UPSERT kullanarak merge işlemi
      const { data, error } = await supabase
        .from("payterProducts")
        .upsert(products, { onConflict: "serialNumber" })
        .select();

      if (error) {
        console.error("❌ Error upserting products:", error);
        return c.json({ success: false, error: error.message }, 500);
      }

      stats = {
        total: data.length,
        added: products.length,
        updated: 0,
      };
    } else {
      // Replace: önce sil, sonra ekle
      await supabase.from("payterProducts").delete().neq("id", "");
      
      const { data, error } = await supabase
        .from("payterProducts")
        .insert(products)
        .select();

      if (error) {
        console.error("❌ Error replacing products:", error);
        return c.json({ success: false, error: error.message }, 500);
      }

      stats = {
        total: data.length,
        added: data.length,
        updated: 0,
      };
    }

    console.log(
      `✅ Products synced (${source}): ${stats.total} total, ${stats.added} added, ${stats.updated} updated`
    );

    return c.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("❌ Error syncing products:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// BANK/PF ENDPOINTS (bankPFRecords)
// ========================================

// GET /bankpf - Bank/PF kayıtlarını getir
app.get("/make-server-9ec5bbb3/bankpf", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bankPFRecords")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching bankPF:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} bankPF records`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ Error fetching bankPF:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /bankpf - Bank/PF kayıtlarını kaydet
app.post("/make-server-9ec5bbb3/bankpf", async (c) => {
  try {
    const body = await c.req.json();
    const records = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("bankPFRecords")
      .insert(records)
      .select();

    if (error) {
      console.error("❌ Error saving bankPF:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ BankPF records saved: ${data.length} records`);
    return c.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("❌ Error saving bankPF:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// INCOME ENDPOINTS (income_records)
// ========================================

// GET /income - Gelir kayıtlarını getir
app.get("/make-server-9ec5bbb3/income", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("income_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching income:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} income records`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ Error fetching income:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /income - Gelir kayıtlarını kaydet
app.post("/make-server-9ec5bbb3/income", async (c) => {
  try {
    const body = await c.req.json();
    const records = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("income_records")
      .insert(records)
      .select();

    if (error) {
      console.error("❌ Error saving income:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Income records saved: ${data.length} records`);
    return c.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("❌ Error saving income:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// SIGNS ENDPOINTS (signs)
// ========================================

// GET /signs - Tabela kayıtlarını getir
app.get("/make-server-9ec5bbb3/signs", async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("signs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching signs:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} sign records`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("❌ Error fetching signs:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /signs - Tabela kayıtlarını kaydet
app.post("/make-server-9ec5bbb3/signs", async (c) => {
  try {
    const body = await c.req.json();
    const records = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("signs")
      .insert(records)
      .select();

    if (error) {
      console.error("❌ Error saving signs:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Sign records saved: ${data.length} records`);
    return c.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error("❌ Error saving signs:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========================================
// GENERIC ENDPOINTS - Diğer tablolar için
// ========================================

// GET /data/:table - Herhangi bir tabloyu oku
app.get("/make-server-9ec5bbb3/data/:table", async (c) => {
  try {
    const table = c.req.param("table");
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from(table)
      .select("*");

    if (error) {
      console.error(`❌ Error fetching ${table}:`, error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Fetched ${data.length} records from ${table}`);
    return c.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error(`❌ Error fetching table:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /data/:table - Herhangi bir tabloya yaz
app.post("/make-server-9ec5bbb3/data/:table", async (c) => {
  try {
    const table = c.req.param("table");
    const body = await c.req.json();
    const records = Array.isArray(body) ? body : [body];
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select();

    if (error) {
      console.error(`❌ Error inserting into ${table}:`, error);
      return c.json({ success: false, error: error.message }, 500);
    }

    console.log(`✅ Inserted ${data.length} records into ${table}`);
    return c.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: any) {
    console.error(`❌ Error inserting into table:`, error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
